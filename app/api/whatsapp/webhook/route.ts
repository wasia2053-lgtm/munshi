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

      console.log('📞 From:', customerPhone)
      console.log('💬 Text:', messageText)

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
            content: `You are Munshi, a helpful customer service assistant. You MUST respond ONLY in Roman Urdu (Urdu written in English alphabets). NEVER use Hindi, NEVER use English, NEVER use Urdu script. Roman Urdu example: "Aap ka masla hal ho jayega", "Hum aap ki madad karenge". Keep responses friendly, short (2-3 sentences max), and professional. If info not available say: "Is baare mein hamari team aap se rabta karegi."

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

      // ─── Save to Supabase ───────────────────────────────
      // 1. Upsert conversation
      const { data: convo, error: convoError } = await supabase
        .from('conversations')
        .upsert({
          business_id: BUSINESS_ID,
          customer_phone: customerPhone,
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'business_id,customer_phone' })
        .select()
        .single()

      if (convoError) {
        console.log('❌ Conversation save error:', convoError.message)
        continue
      }

      // 2. Save customer message to messages table
      await supabase.from('messages').insert({
        conversation_id: convo.id,
        business_id: BUSINESS_ID,
        customer_phone: customerPhone,
        message_text: messageText,
        message_type: 'customer',
        whatsapp_message_id: msg.id,
        created_at: new Date().toISOString()
      })

      // 3. Save bot reply to messages table
      await supabase.from('messages').insert({
        conversation_id: convo.id,
        business_id: BUSINESS_ID,
        customer_phone: customerPhone,
        message_text: aiReply,
        message_type: 'bot',
        created_at: new Date().toISOString()
      })

      console.log('✅ Saved to Supabase!')
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error: any) {
    console.error('❌ ERROR:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}