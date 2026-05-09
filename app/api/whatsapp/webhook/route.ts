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

      // Step 1: Check if conversation exists with this phone + business_id
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
        // UPDATE last_message + last_message_time for existing conversation
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
        // INSERT new conversation only if not found
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
          // Handle potential duplicate insert errors
          if (insertError.code === '23505' || insertError.message?.includes('unique')) {
            console.log('Duplicate detected, trying to fetch existing conversation...')
            const { data: retryExisting } = await supabase
              .from('conversations')
              .select('id')
              .eq('customer_phone', customerPhone)
              .eq('business_id', BUSINESS_ID)
              .single()
            
            if (retryExisting) {
              conversationId = retryExisting.id
              console.log('Found existing conversation after duplicate error:', conversationId)
            } else {
              console.log('Insert error after retry:', insertError.message)
              continue
            }
          } else {
            console.log('Insert error:', insertError.message)
            continue
          }
        } else {
          conversationId = newConv.id
          console.log('Created new conversation with ID:', conversationId)
        }
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
        .select('bot_name, organization_name, language, tone, greeting_message, operating_hours, away_message')
        .eq('business_id', BUSINESS_ID)
        .single()

      // Helper function to check if business is open
      function isBusinessOpen(operatingHours: any): boolean {
        if (!operatingHours) return true // default open
        
        // Pakistan timezone (UTC+5)
        const now = new Date()
        const pakistanTime = new Date(now.getTime() + (5 * 60 * 60 * 1000))
        
        const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
        const dayName = days[pakistanTime.getUTCDay()]
        const daySettings = operatingHours[dayName]
        
        if (!daySettings || !daySettings.enabled) return false
        
        const currentHour = pakistanTime.getUTCHours()
        const currentMin = pakistanTime.getUTCMinutes()
        const currentTotal = currentHour * 60 + currentMin
        
        const [openH, openM] = daySettings.open.split(':').map(Number)
        const [closeH, closeM] = daySettings.close.split(':').map(Number)
        const openTotal = openH * 60 + openM
        const closeTotal = closeH * 60 + closeM
        
        return currentTotal >= openTotal && currentTotal <= closeTotal
      }

      const botName = settings?.bot_name || 'Munshi'
      const orgName = settings?.organization_name || 'Company'
      const language = settings?.language || 'roman_urdu'
      const tone = settings?.tone || 'friendly'

      console.log(`⚙️ Settings - Name: ${botName}, Org: ${orgName}, Lang: ${language}, Tone: ${tone}`)

      const languageInstruction = 
        language === 'roman_urdu' ? 'ALWAYS respond in Roman Urdu (Urdu words in English letters). Never use Hindi or Urdu script.' :
        language === 'english' ? 'ALWAYS respond in English only.' :
        language === 'urdu_script' ? 'ALWAYS respond in Urdu script (Arabic letters).' :
        language === 'arabic' ? 'ALWAYS respond in Arabic.' :
        'ALWAYS respond in Roman Urdu.'

      const toneInstruction =
        tone === 'professional' ? 'Be formal and professional in responses.' :
        tone === 'friendly' ? 'Be warm, friendly and approachable.' :
        tone === 'casual' ? 'Be casual and relaxed, like a friend.' :
        'Be friendly and helpful.'

      // ─── Fetch Conversation History ───────────────────────────
      const { data: recentMsgs } = await supabase
        .from('messages')
        .select('sender, content, timestamp')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: false })
        .limit(20)

      const conversationHistory = recentMsgs ? recentMsgs.reverse().map(m => ({
        role: m.sender === 'bot' ? 'assistant' : 'user',
        content: m.content
      })) : []

      // ─── Fetch Knowledge Base ───────────────────────────
      const { data: kbData } = await supabase
        .from('knowledge_base')
        .select('source_type, source_url, content')
        .eq('business_id', BUSINESS_ID)
        .limit(30)

      let knowledgeContext = 'No knowledge available'
      if (kbData && kbData.length > 0) {
        knowledgeContext = kbData
          .map((item: any) => `[${item.source_type}] ${item.source_url}:\n${item.content.substring(0, 500)}`)
          .join('\n\n')
        console.log(`📚 Knowledge base loaded: ${kbData.length} entries`)
      }

      // ─── Check Business Hours ───────────────────────────
      const open = isBusinessOpen(settings?.operating_hours)
      if (!open) {
        const awayMsg = settings?.away_message || 'Assalam o alaikum! Abhi hum available nahi hain.'
        
        // Send away message via WhatsApp
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
              text: { body: awayMsg }
            })
          }
        )
        
        const waResult = await waRes.json()
        if (!waRes.ok) {
          console.log('❌ WhatsApp Away Message Error:', waResult)
        } else {
          console.log('✅ Away message sent:', awayMsg)
        }
        
        // Save away message to database
        const { error: awayError } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender: 'bot',
          content: awayMsg,
          timestamp: new Date().toISOString()
        })
        
        if (awayError) {
          console.log('❌ Away message save error:', awayError.message)
        } else {
          console.log('✅ Away message saved to messages table')
        }
        
        continue // Skip AI generation and move to next message
      }

      // ─── Generate AI Response ───────────────────────────
      const greeting_message = settings?.greeting_message || 'Hello! How can I help you today?'
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: `Tu Munshi hai — ${orgName} ka WhatsApp sales agent.
Tera kaam hai customers ki madad karna bilkul ek real Pakistani sales representative ki tarah.

STRICT LANGUAGE RULES:
- SIRF Roman Urdu mein baat karo
- Hindi words BILKUL nahi: "aapka", "hain", "mein" nahi bolna — Pakistani style: "apka", "hen", "me"
- "Ji" use karo — "haan" nahi
- Kabhi bhi robotic/formal mat lagna
- Chhoti sentences, natural flow

PERSONALITY:
- Warm, friendly, thoda casual
- Jaise koi dukaan ka helpful banda ho
- Customer ki baat dhyan se suno
- Khud se suggest karo related products

NEGOTIATION RULES:
- Agar customer price kam karne ko kahe:
  → Product ki value explain karo (quality, taste, etc.)
  → Agar knowledge base mein koi sale/discount mention hai to wahi batao
  → Agar koi discount nahi hai knowledge base mein to seedha kaho: "Bhai abhi koi offer nahi chal raha, lekin quality guaranteed hai — ek baar try karo"
  → KABHI BHI khud se discount mat do jo knowledge base mein nahi hai

SALES RULES:
- Agar koi product puche → price batao + upsell karo
- "Ye bhi try karo" → related product suggest karo
- Order lane ki koshish karo conversation mein hi
- Agar stock/delivery puche → website se jo pata hai batao

FALLBACK RULE:
- Sirf tab "website dekho" kaho jab GENUINELY koi info nahi ho — warna khud jawab do

KNOWLEDGE BASE:
${knowledgeContext}

Greeting: ${greeting_message}` },
          ...conversationHistory,
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