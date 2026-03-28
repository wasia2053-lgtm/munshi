import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'munshi_verify_123'

// ── GET: Webhook Verification ──
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified!')
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// ── POST: Incoming Messages ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate it's a WhatsApp message
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ok' })
    }

    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    // Handle incoming messages
    if (value?.messages && value.messages.length > 0) {
      for (const message of value.messages) {
        const customerPhone = message.from
        const messageContent = message.text?.body || ''
        const businessPhoneId = value.metadata?.phone_number_id

        if (!messageContent) continue

        console.log(`📩 New message from ${customerPhone}: ${messageContent}`)

        // Find the business by whatsapp_number or phone_number_id
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('whatsapp_phone_id', businessPhoneId)
          .single()

        // If not found by phone_id, try first available connected business
        let businessId = business?.id
        if (!businessId) {
          const { data: anyBusiness } = await supabase
            .from('businesses')
            .select('id')
            .neq('user_id', null)
            .limit(1)
            .single()
          businessId = anyBusiness?.id
        }

        if (!businessId) {
          console.error('❌ No business found for this webhook')
          continue
        }

        // Find or create conversation
        let conversationId: string

        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('business_id', businessId)
          .eq('customer_phone', customerPhone)
          .single()

        if (existingConv) {
          conversationId = existingConv.id
          // Update updated_at
          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId)
        } else {
          // Create new conversation
          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              business_id: businessId,
              customer_phone: customerPhone,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select('id')
            .single()

          if (convError || !newConv) {
            console.error('❌ Error creating conversation:', convError)
            continue
          }
          conversationId = newConv.id
        }

        // Save customer message to messages table
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender: 'customer',
          content: messageContent,
          timestamp: new Date().toISOString(),
        })

        // Generate AI reply
        const aiReply = await generateAIReply(messageContent, businessId)

        // Save bot reply to messages table
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender: 'bot',
          content: aiReply,
          timestamp: new Date().toISOString(),
        })

        // Send reply via WhatsApp API
        await sendWhatsAppMessage(customerPhone, aiReply, businessPhoneId)
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

// ── Generate AI Reply using Groq ──
async function generateAIReply(customerMessage: string, businessId: string): Promise<string> {
  try {
    // Get business knowledge base
    const { data: knowledge } = await supabase
      .from('knowledge_base')
      .select('content')
      .eq('business_id', businessId)
      .limit(5)

    const knowledgeText = knowledge?.map(k => k.content).join('\n\n') || ''

    const systemPrompt = `Tu ek helpful WhatsApp customer service bot hai jo Pakistani e-commerce business ke liye kaam karta hai. 
Tu Roman Urdu mein reply karta hai (Urdu ko English letters mein likhna).
Tu concise aur helpful responses deta hai.
${knowledgeText ? `\nBusiness Information:\n${knowledgeText}` : ''}
Agar koi information nahi pata toh politely batao ke hum jaldi contact karenge.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: customerMessage }
        ],
        max_tokens: 300,
        temperature: 0.7,
      })
    })

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Shukriya aapke message ka! Hum jaldi aapko reply karenge.'
  } catch (error) {
    console.error('❌ AI error:', error)
    return 'Shukriya aapke message ka! Hum jaldi aapko reply karenge.'
  }
}

// ── Send WhatsApp Message via Meta API ──
async function sendWhatsAppMessage(to: string, message: string, phoneNumberId: string) {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message },
        }),
      }
    )

    const data = await response.json()
    if (data.error) {
      console.error('❌ WhatsApp send error:', data.error)
    } else {
      console.log('✅ Message sent to', to)
    }
  } catch (error) {
    console.error('❌ Send message error:', error)
  }
}