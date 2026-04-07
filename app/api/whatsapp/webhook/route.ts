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

    console.log('\n MESSAGE RECEIVED')
    console.log('Time:', new Date().toISOString())
    console.log('Body:', JSON.stringify(body, null, 2))

    // Process messages
    if (body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      const messages = body.entry[0].changes[0].value.messages
      console.log(`Found ${messages.length} message(s)`)
      
      for (const msg of messages) {
        if (msg.type !== 'text' || !msg.text?.body) {
          console.log(' Skipping non-text message')
          continue
        }

        const customerPhone = msg.from
        const messageText = msg.text.body
        const businessId = 'default' // You might want to extract this from somewhere
        
        console.log(`\n Message Details:`)
        console.log('   From:', customerPhone)
        console.log('   Text:', messageText)
        console.log('   ID:', msg.id)

        try {
          // Generate AI response
          console.log('\n Generating AI response...')
          const chatCompletion = await groq.chat.completions.create({
            messages: [
              {
                role: 'system',
                content: 'You are Munshi, customer service assistant. Respond in Roman Urdu. Keep responses short (2-3 sentences max).'
              },
              {
                role: 'user',
                content: messageText
              }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 256
          })

          const aiReply = chatCompletion.choices[0]?.message?.content
          
          if (!aiReply) {
            console.log(' No AI response generated')
            continue
          }

          console.log(' AI Response:', aiReply)

          // Send WhatsApp response
          console.log('\n Sending WhatsApp response...')
          console.log(' WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID)
          
          const whatsappResponse = await fetch(
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

          const whatsappResult = await whatsappResponse.json()
          
          console.log('\n=== WHATSAPP API RESPONSE ===')
          console.log('Status:', whatsappResponse.status)
          console.log('Status Text:', whatsappResponse.statusText)
          console.log('Response Body:', JSON.stringify(whatsappResult, null, 2))
          
          if (!whatsappResponse.ok) {
            console.log(' WhatsApp API Error:', whatsappResult)
          } else {
            console.log(' WhatsApp message sent successfully')
          }
          console.log('==============================\n')

          // Save conversation to Supabase
          console.log(' Saving conversation to Supabase...')
          const { error: saveError } = await supabase
            .from('conversations')
            .insert({
              business_id: businessId,
              customer_phone: customerPhone,
              message_text: messageText,
              message_type: 'customer',
              created_at: new Date().toISOString()
            })

          if (saveError) {
            console.log(' Supabase save error (customer):', saveError.message)
          }

          // Save AI response to Supabase
          const { error: botSaveError } = await supabase
            .from('conversations')
            .insert({
              business_id: businessId,
              customer_phone: customerPhone,
              message_text: aiReply,
              message_type: 'bot',
              created_at: new Date().toISOString()
            })

          if (botSaveError) {
            console.log(' Supabase save error (bot):', botSaveError.message)
          }

        } catch (aiError: any) {
          console.log(' AI/WhatsApp error:', aiError.message)
        }
      }
    } else {
      console.log(' No messages in payload')
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error: any) {
    console.error(' ERROR:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}