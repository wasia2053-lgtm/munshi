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

  console.log('🔐 Webhook verification attempt')

  // Verify webhook
  if (hubMode === 'subscribe' && hubVerifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ Webhook verified')
    return new NextResponse(hubChallenge)
  }

  console.log('❌ Webhook verification failed')
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📨 Webhook payload received')

    // Handle WhatsApp webhook payload
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            for (const message of change.value.messages) {
              if (message.type === 'text' && !message.from_me) {
                console.log('💬 Processing text message from:', message.from)
                await processIncomingMessage(message)
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'received' })
  } catch (error) {
    console.error('🔥 WhatsApp webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function processIncomingMessage(message: any) {
  try {
    const from = message.from // Phone number
    const messageText = message.text.body // Message content
    const timestamp = message.timestamp
    const messageId = message.id

    console.log('📝 Message details:')
    console.log('   From:', from)
    console.log('   Text:', messageText.substring(0, 50))

    // TODO: Extract businessId from phone number or database
    // For now, use a default or map phone to business
    const businessId = await getBusinessIdFromPhone(from) || '00000000-0000-0000-0000-000000000001'
    
    console.log('🆔 Using businessId:', businessId)

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
      console.error('❌ Error saving conversation:', conversationError)
    } else {
      console.log('✅ Conversation saved:', conversation?.id)
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
      console.error('❌ Error saving message:', messageError)
    } else {
      console.log('✅ Customer message saved')
    }

    // Call AI chat API to get response
    try {
      console.log('🤖 Calling chat API...')
      
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
        const chatData = await chatResponse.json()
        const aiResponse = chatData.response
        
        console.log('✅ AI response generated')
        console.log('   Training entries used:', chatData.trainingEntriesUsed)
        console.log('   Response:', aiResponse.substring(0, 50))

        // Save AI response to messages
        const { error: saveError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation?.id,
            business_id: businessId,
            customer_phone: from,
            message_text: aiResponse,
            message_type: 'bot',
            created_at: new Date().toISOString()
          })

        if (saveError) {
          console.error('❌ Error saving AI response:', saveError)
        } else {
          console.log('✅ Bot message saved')
        }

        // Send response via WhatsApp API
        console.log('📤 Sending via WhatsApp...')
        await sendWhatsAppMessage(from, aiResponse)
        
      } else {
        console.error('❌ Chat API returned error:', chatResponse.status)
        const errorData = await chatResponse.json()
        console.error('   Error:', errorData)
      }
    } catch (chatError) {
      console.error('❌ Error calling chat API:', chatError)
    }

  } catch (error) {
    console.error('🔥 Error processing incoming message:', error)
  }
}

async function getBusinessIdFromPhone(phone: string): Promise<string | null> {
  try {
    // TODO: Implement logic to map customer phone to business
    // This could be:
    // 1. Query customers table to find business
    // 2. Check if phone is in business contacts
    // 3. Use phone prefix mapping
    
    // For now, return null to use default
    return null
  } catch (error) {
    console.error('Error getting businessId from phone:', error)
    return null
  }
}

async function sendWhatsAppMessage(customerPhone: string, message: string) {
  try {
    console.log('📤 Sending WhatsApp message to:', customerPhone)

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
      const errorText = await response.text()
      console.error('❌ Failed to send WhatsApp message:', errorText)
      return false
    } else {
      console.log('✅ WhatsApp message sent successfully')
      return true
    }
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error)
    return false
  }
}