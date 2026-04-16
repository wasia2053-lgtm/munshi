import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUSINESS_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const hubVerifyToken = searchParams.get('hub.verify_token')
  const hubChallenge = searchParams.get('hub.challenge')

  console.log('🔐 WEBHOOK VERIFICATION')
  console.log('Expected token:', process.env.WHATSAPP_VERIFY_TOKEN)
  console.log('Received token:', hubVerifyToken)
  console.log('Match:', hubVerifyToken === process.env.WHATSAPP_VERIFY_TOKEN)

  if (hubVerifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ VERIFIED')
    return new NextResponse(hubChallenge)
  }
  console.log('❌ FAILED')
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('\n📨 MESSAGE RECEIVED')

    if (!body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      return NextResponse.json({ status: 'ok' })
    }

    const messages = body.entry[0].changes[0].value.messages

    for (const msg of messages) {
      if (msg.type !== 'text' || !msg.text?.body) continue

      const customerPhone = msg.from
      const messageText = msg.text.body
      
      // Strip all non-digits for consistent storage
      const customerPhoneDigits = customerPhone.replace(/\D/g, '')

      console.log('From:', customerPhone, 'Digits:', customerPhoneDigits)
      console.log('Text:', messageText)

      // Step 1: SELECT first to check if conversation exists
      console.log('\nStep 1: Checking for existing conversation...')
      let conversationId: string
      
      const { data: existing, error: selectError } = await supabase
        .from('conversations')
        .select('id')
        .eq('customer_phone', customerPhone)
        .eq('business_id', BUSINESS_ID)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        console.log('Select error:', selectError.message)
        continue
      }

      if (existing) {
        // Update existing conversation
        console.log('Found existing conversation, updating...')
        const { error: updateError } = await supabase.from('conversations').update({
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', existing.id)

        if (updateError) {
          console.log('Update error:', updateError.message)
          continue
        }
        conversationId = existing.id
        console.log('Updated conversation with ID:', conversationId)
      } else {
        // Insert new conversation
        console.log('Creating new conversation...')
        const { data: newConv, error: insertError } = await supabase.from('conversations').insert({
          business_id: BUSINESS_ID,
          customer_phone: customerPhone,
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).select('id').single()

        if (insertError) {
          console.log('Insert error:', insertError.message)
          continue
        }
        conversationId = newConv.id
        console.log('Created new conversation with ID:', conversationId)
      }

      // ─── Step 2: Save Incoming Message ─────────────────────
      console.log('\nStep 2: Saving incoming message...')
      const { error: incomingError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender: 'customer',
        content: messageText,
        timestamp: new Date().toISOString()
      })

      if (incomingError) {
        console.log('❌ Incoming message save error:', incomingError.message)
      } else {
        console.log('✅ Incoming message saved to messages table')
      }

      // ─── Fetch Business Settings ────────────────────────
      const { data: settings } = await supabase
        .from('business_settings')
        .select('bot_name, language, tone')
        .eq('business_id', BUSINESS_ID)
        .single()

      const botName = settings?.bot_name || 'Munshi'
      const language = settings?.language || 'roman_urdu'
      const tone = settings?.tone || 'professional'

      console.log(`⚙️ Settings - Name: ${botName}, Lang: ${language}, Tone: ${tone}`)

      const languageInstruction =
        language === 'roman_urdu'
          ? 'ONLY respond in Roman Urdu (Urdu words written in English letters). NEVER use Hindi. NEVER use Urdu script. Example: "Aap ka masla hal ho jayega", "Hum aap ki madad karenge"'
          : language === 'english'
          ? 'ONLY respond in English'
          : language === 'urdu_script'
          ? 'ONLY respond in Urdu script (اردو)'
          : language === 'arabic'
          ? 'ONLY respond in Arabic'
          : 'ONLY respond in Roman Urdu'

      const toneInstruction =
        tone === 'professional'
          ? 'Be formal and professional'
          : tone === 'friendly'
          ? 'Be warm, friendly and approachable'
          : 'Be casual and relaxed'

      // ─── Fetch Knowledge Base ───────────────────────────
      const { data: kbData } = await supabase
        .from('knowledge_base')
        .select('source_type, source_url, content')
        .eq('business_id', BUSINESS_ID)
        .limit(20)

      let knowledgeContext = 'No knowledge available'
      if (kbData && kbData.length > 0) {
        knowledgeContext = kbData
          .map((item: any) => `[${item.source_type}] ${item.source_url}:\n${item.content.substring(0, 500)}`)
          .join('\n\n')
        console.log(`📚 Knowledge base loaded: ${kbData.length} entries`)
      }

      // ─── Generate AI Response ───────────────────────────
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are ${botName}, a helpful customer service assistant. ${languageInstruction}. ${toneInstruction}. Keep responses short (2-3 sentences max). If info not available say: "Is baare mein hamari team aap se rabta karegi."

KNOWLEDGE BASE:
${knowledgeContext}`
          },
          { role: 'user', content: messageText }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 256
      })

      const aiReply = chatCompletion.choices[0]?.message?.content
      if (!aiReply) continue
      console.log('🤖 AI Reply:', aiReply)

      // ─── Send WhatsApp Response ─────────────────────────
      const waRes = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: customerPhone,
            type: 'text',
            text: { body: aiReply }
          })
        }
      )

      const waResult = await waRes.json()
      if (!waRes.ok) {
        console.log('❌ WhatsApp Error:', waResult)
        continue
      }
      console.log('✅ WhatsApp message sent!')

      // ─── Step 4: Save Outgoing Message ─────────────────────
      console.log('\nStep 4: Saving outgoing message...')
      const { error: outgoingError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender: 'bot',
        content: aiReply,
        timestamp: new Date().toISOString()
      })

      if (outgoingError) {
        console.log('❌ Outgoing message save error:', outgoingError.message)
      } else {
        console.log('✅ Outgoing message saved to messages table')
      }

      console.log('\n🎉 All steps completed successfully!')
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error: any) {
    console.error('❌ ERROR:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}