import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const hubMode = searchParams.get('hub.mode')
  const hubChallenge = searchParams.get('hub.challenge')
  const hubVerifyToken = searchParams.get('hub.verify_token')

  // Verify webhook
  if (hubMode === 'subscribe' && hubVerifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(hubChallenge)
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle WhatsApp webhook payload
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            for (const message of change.value.messages) {
              if (message.type === 'text' && !message.from_me) {
                await processIncomingMessage(message)
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'received' })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function processIncomingMessage(message: any) {
  try {
    const from = message.from // Phone number
    const messageText = message.text.body // Message content
    const timestamp = message.timestamp
    const messageId = message.id

    // Extract businessId (for now, use a default or extract from phone/other logic)
    const businessId = 'default' // You can modify this logic based on your business identification

    // Save conversation to Supabase
    const { data: conversation, error: conversationError } = await supabase
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

    if (conversationError) {
      console.error('Error saving conversation:', conversationError)
    }

    // Save message to Supabase
    const { data: messageData, error: messageError } = await supabase
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
      .select()

    if (messageError) {
      console.error('Error saving message:', messageError)
    }

    // Call AI chat API to get response
    try {
      const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          businessId: businessId
        })
      })

      if (chatResponse.ok) {
        const { response: aiResponse } = await chatResponse.json()
        
        // Save AI response to messages
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversation?.id,
            business_id: businessId,
            customer_phone: from,
            message_text: aiResponse,
            message_type: 'bot',
            created_at: new Date().toISOString()
          })

        // TODO: Send response back via WhatsApp API
        console.log('AI Response:', aiResponse)
        console.log('Would send to WhatsApp:', from)
        
        // Send response via WhatsApp API
        await sendWhatsAppMessage(from, aiResponse)
        
      } else {
        console.error('Failed to get AI response')
      }
    } catch (chatError) {
      console.error('Error calling chat API:', chatError)
    }

  } catch (error) {
    console.error('Error processing incoming message:', error)
  }
}

async function sendWhatsAppMessage(customerPhone: string, message: string) {
  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: customerPhone,
        type: 'text',
        text: { body: message }
      })
    })

    if (!response.ok) {
      console.error('Failed to send WhatsApp message:', await response.text())
    } else {
      console.log('WhatsApp message sent successfully to:', customerPhone)
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
  }
}
