import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'munshi_verify_123'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.object !== 'whatsapp_business_account') return NextResponse.json({ status: 'ok' })

    const value = body.entry?.[0]?.changes?.[0]?.value
    if (!value?.messages?.length) return NextResponse.json({ status: 'ok' })

    for (const message of value.messages) {
      const customerPhone = message.from
      const messageContent = message.text?.body || ''
      const businessPhoneId = value.metadata?.phone_number_id
      if (!messageContent) continue

      // 1. Find business
      const { data: waNum } = await supabase
        .from('whatsapp_numbers')
        .select('business_id')
        .eq('phone_number_id', businessPhoneId)
        .single()

      let businessId = waNum?.business_id
      if (!businessId) {
        const { data: b } = await supabase
          .from('businesses')
          .select('id')
          .eq('whatsapp_phone_id', businessPhoneId)
          .single()
        businessId = b?.id
      }
      if (!businessId) { console.error('❌ No business found'); continue }

      // 2. Check message limit
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('messages_used, messages_limit')
        .eq('user_id', businessId)
        .maybeSingle()

      const used = sub?.messages_used || 0
      const limit = sub?.messages_limit || 50
      if (used >= limit) {
        console.log(`⛔ Limit reached for ${businessId}`)
        continue
      }

      // 3. Get business settings
      const { data: settings } = await supabase
        .from('business_settings')
        .select('bot_name, language, tone, operating_hours, away_message, organization_name')
        .eq('business_id', businessId)
        .single()

      // 4. Check operating hours
      if (settings?.operating_hours) {
        const now = new Date()
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const dayName = days[now.getDay()]
        const dayHours = settings.operating_hours[dayName]
        if (dayHours && !dayHours.enabled && settings.away_message) {
          await sendWhatsAppMessage(customerPhone, settings.away_message, businessPhoneId)
          continue
        }
      }

      // 5. Find or create conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('business_id', businessId)
        .eq('customer_phone', customerPhone)
        .single()

      let conversationId: string
      if (existingConv) {
        conversationId = existingConv.id
        await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
      } else {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({ business_id: businessId, customer_phone: customerPhone, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .select('id').single()
        if (convError || !newConv) { console.error('❌ Conv error:', convError); continue }
        conversationId = newConv.id
      }

      // 6. Save customer message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender: 'customer',
        content: messageContent,
        timestamp: new Date().toISOString(),
      })

      // 7. Get last 20 messages for context
      const { data: history } = await supabase
        .from('messages')
        .select('sender, content')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: false })
        .limit(20)

      const historyMessages = (history || []).reverse().map(m => ({
        role: m.sender === 'bot' ? 'assistant' : 'user',
        content: m.content,
      }))

      // 8. Generate AI reply
      const { reply, summary } = await generateAIReply(
        messageContent,
        businessId,
        historyMessages,
        settings
      )

      // 9. Save bot message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender: 'bot',
        content: reply,
        timestamp: new Date().toISOString(),
      })

      // 10. Update conversation last_message + summary
      await supabase.from('conversations').update({
        last_message: messageContent,
        last_message_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(summary ? { customer_summary: summary } : {}),
      }).eq('id', conversationId)

      // 11. Increment messages_used
      await supabase.from('subscriptions')
        .update({ messages_used: used + 1 })
        .eq('user_id', businessId)

      // 12. Send reply
      await sendWhatsAppMessage(customerPhone, reply, businessPhoneId)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

async function generateAIReply(
  customerMessage: string,
  businessId: string,
  history: { role: string; content: string }[],
  settings: any
): Promise<{ reply: string; summary: string | null }> {
  try {
    const { data: knowledge } = await supabase
      .from('knowledge_base')
      .select('content')
      .eq('business_id', businessId)
      .limit(5)

    const knowledgeText = knowledge?.map(k => k.content).join('\n\n') || ''

    const lang = settings?.language || 'roman_urdu'
    const tone = settings?.tone || 'friendly'
    const botName = settings?.bot_name || 'Munshi'
    const orgName = settings?.organization_name || 'our business'

    // Language instruction
    const langMap: Record<string, string> = {
      english_us: 'Reply in American English.',
      english_uk: 'Reply in British English (use colour, organise, whilst etc.).',
      roman_urdu: 'Reply in Roman Urdu (Urdu written in English letters, e.g. "Aap ka shukriya").',
      arabic: 'Reply in Arabic script.',
    }
    const langInstruction = langMap[lang] || langMap['roman_urdu']

    // Tone instruction
    const toneMap: Record<string, string> = {
      professional: 'Be formal and professional.',
      friendly: 'Be warm and friendly.',
      casual: 'Be casual and relaxed.',
    }
    const toneInstruction = toneMap[tone] || toneMap['friendly']

    // Detect customer language and override if different
    const detectLang = (msg: string) => {
      if (/[\u0600-\u06FF]/.test(msg)) return 'arabic'
      if (/[a-zA-Z]/.test(msg) && !/[\u0600-\u06FF]/.test(msg)) {
        const urduWords = ['kya', 'hai', 'hain', 'ap', 'aap', 'mujhe', 'chahiye', 'price', 'kitna', 'kab']
        const hasUrdu = urduWords.some(w => msg.toLowerCase().includes(w))
        return hasUrdu ? 'roman_urdu' : 'english_us'
      }
      return lang
    }
    const detectedLang = detectLang(customerMessage)
    const effectiveLangInstruction = detectedLang !== lang
      ? langMap[detectedLang] || langInstruction
      : langInstruction

    const systemPrompt = `You are ${botName}, a customer service assistant for ${orgName}.
${effectiveLangInstruction}
${toneInstruction}
Keep replies concise (under 150 words).
${knowledgeText ? `\nBusiness Knowledge:\n${knowledgeText}` : ''}
If you don't know something, say you'll follow up shortly.

At the END of your reply (after the customer-facing text), add a hidden summary tag:
[SUMMARY: one sentence about this customer's intent/needs]
This tag will be stripped before sending to customer.`

    const messages = [
      ...history.slice(-10),
      { role: 'user', content: customerMessage },
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 400,
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content || ''

    // Extract summary tag
    const summaryMatch = raw.match(/\[SUMMARY:\s*(.*?)\]/i)
    const summary = summaryMatch ? summaryMatch[1].trim() : null
    const reply = raw.replace(/\[SUMMARY:.*?\]/gi, '').trim()

    return { reply, summary }
  } catch (error) {
    console.error('❌ AI error:', error)
    return { reply: 'Shukriya! Hum jaldi reply karenge.', summary: null }
  }
}

async function sendWhatsAppMessage(to: string, message: string, phoneNumberId: string) {
  try {
    const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    })
    const data = await response.json()
    if (data.error) console.error('❌ WA send error:', data.error)
    else console.log('✅ Sent to', to)
  } catch (error) {
    console.error('❌ Send error:', error)
  }
}