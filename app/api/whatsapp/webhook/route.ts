import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const hubMode = searchParams.get('hub.mode')
  const hubChallenge = searchParams.get('hub.challenge')
  const hubVerifyToken = searchParams.get('hub.verify_token')

  console.log('🔐 [WEBHOOK] Verification attempt')
  console.log('   Mode:', hubMode)
  console.log('   Token match:', hubVerifyToken === process.env.WHATSAPP_VERIFY_TOKEN)

  if (hubMode === 'subscribe' && hubVerifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ [WEBHOOK] Verified successfully')
    return new NextResponse(hubChallenge)
  }

  console.log('❌ [WEBHOOK] Verification failed')
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    
    console.log('\n═══════════════════════════════════════════')
    console.log('📨 [WEBHOOK] Incoming WhatsApp Message')
    console.log('═══════════════════════════════════════════')
    console.log('Timestamp:', new Date().toISOString())

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            for (const message of change.value.messages) {
              if (message.type === 'text' && !message.from_me) {
                console.log(`\n📬 Processing message from: ${message.from}`)
                await processIncomingMessage(message)
              }
            }
          }
        }
      }
    }

    const elapsed = Date.now() - startTime
    console.log(`\n✅ [WEBHOOK] Completed in ${elapsed}ms`)
    console.log('═══════════════════════════════════════════\n')

    return NextResponse.json({ status: 'received' })
  } catch (error) {
    console.error('🔥 [WEBHOOK] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function processIncomingMessage(message: any) {
  try {
    const from = message.from
    const messageText = message.text.body
    const timestamp = message.timestamp
    const messageId = message.id

    console.log('   Message:', messageText.substring(0, 50))
    console.log('   Type: text')

    const businessId = '00000000-0000-0000-0000-000000000001' // TODO: Extract from phone

    // Save conversation
    console.log('\n💾 Saving to conversations...')
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .upsert({
        business_id: businessId,
        customer_phone: from,
        last_message: messageText,
        last_message_time: new Date(timestamp * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'business_id,customer_phone'
      })
      .select()
      .single()

    if (convError) {
      console.error('   ❌ Error:', convError.message)
    } else {
      console.log(`   ✅ Conversation saved: ${conversation?.id}`)
    }

    // Save customer message
    console.log('\n💾 Saving customer message...')
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation?.id,
        business_id: businessId,
        customer_phone: from,
        message_text: messageText,
        message_type: 'customer',
        whatsapp_message_id: messageId,
        created_at: new Date(timestamp * 1000).toISOString()
      })

    if (msgError) {
      console.error('   ❌ Error:', msgError.message)
    } else {
      console.log('   ✅ Customer message saved')
    }

    // Call AI
    console.log('\n🤖 Calling AI chat...')
    const chatStartTime = Date.now()

    const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageText,
        businessId: businessId
      })
    })

    const chatElapsed = Date.now() - chatStartTime
    console.log(`   ⏱️  Chat API took: ${chatElapsed}ms`)

    if (!chatResponse.ok) {
      console.error(`   ❌ Chat API error: ${chatResponse.status}`)
      const errorData = await chatResponse.json()
      console.error('   Error:', errorData)
      return
    }

    const { response: aiResponse } = await chatResponse.json()
    console.log(`   ✅ AI Response: "${aiResponse.substring(0, 50)}..."`)

    // Save bot message
    console.log('\n💾 Saving bot message...')
    const { error: botMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation?.id,
        business_id: businessId,
        customer_phone: from,
        message_text: aiResponse,
        message_type: 'bot',
        created_at: new Date().toISOString()
      })

    if (botMsgError) {
      console.error('   ❌ Error:', botMsgError.message)
    } else {
      console.log('   ✅ Bot message saved')
    }

    // Send WhatsApp
    console.log('\n📤 Sending WhatsApp message...')
    const whatsappStartTime = Date.now()

    const waResponse = await fetch(
      `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: from,
          type: 'text',
          text: { body: aiResponse }
        })
      }
    )

    const waElapsed = Date.now() - whatsappStartTime
    console.log(`   ⏱️  WhatsApp API took: ${waElapsed}ms`)

    if (!waResponse.ok) {
      const errorText = await waResponse.text()
      console.error(`   ❌ WhatsApp error: ${waResponse.status}`)
      console.error('   Response:', errorText)
    } else {
      console.log('   ✅ Message sent to WhatsApp')
    }

  } catch (error: any) {
    console.error('🔥 Processing error:', error.message)
  }
}