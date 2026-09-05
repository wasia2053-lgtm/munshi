import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import crypto from 'crypto'
type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Verify request really came from Meta (not a faker hitting our URL) ───
function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !process.env.META_APP_SECRET) return false

  const expected = crypto
    .createHmac('sha256', process.env.META_APP_SECRET)
    .update(rawBody)
    .digest('hex')

  const received = signatureHeader.replace('sha256=', '')

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))
  } catch {
    return false // length mismatch etc — definitely not a match
  }
}

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
    const rawBody = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    if (!verifySignature(rawBody, signature)) {
      console.log('❌ Invalid or missing signature — rejecting request')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const body = JSON.parse(rawBody)
    console.log('\n📨 MESSAGE RECEIVED')

    if (!body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      return NextResponse.json({ status: 'ok' })
    }

    const messages = body.entry[0].changes[0].value.messages

    // ─── Resolve which business owns this WhatsApp number ──────
    // (was hardcoded before — broke multi-tenant, every message went to one business)
    const phoneNumberId = body.entry[0].changes[0].value.metadata?.phone_number_id

    if (!phoneNumberId) {
      console.log('❌ No phone_number_id in webhook payload, skipping')
      return NextResponse.json({ status: 'ok' })
    }

    const { data: waNumber, error: waNumberError } = await supabase
      .from('whatsapp_numbers')
      .select('business_id, access_token')
      .eq('phone_number_id', phoneNumberId)
      .eq('status', 'connected')
      .single()

    if (waNumberError || !waNumber) {
      console.log('❌ No connected business found for phone_number_id:', phoneNumberId)
      return NextResponse.json({ status: 'ok' })
    }

    const BUSINESS_ID = waNumber.business_id
    // Outbound send credentials: this number's own token if set, else fall back to the
    // global env var (keeps today's single-number setup working while multi-number is rolled out)
    const WA_ACCESS_TOKEN = waNumber.access_token || process.env.WHATSAPP_ACCESS_TOKEN

    for (const msg of messages) {
      if (msg.type !== 'text' || !msg.text?.body) continue

      // ─── Skip if Meta already sent us this exact message before ───
      // (Meta retries webhooks on any hiccup — without this, retries = duplicate bot replies)
      const { error: dupError } = await supabase
        .from('webhook_processed_messages')
        .insert({ wa_message_id: msg.id })

      if (dupError) {
        console.log('⚠️ Duplicate message, already processed — skipping:', msg.id)
        continue
      }

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

      // ─── New Message Notification ───────────────────────
      await supabase
        .from('notifications')
        .insert({
          business_id: BUSINESS_ID,
          type: 'new_message',
          title: 'Naya Message Aaya! 💬',
          message: `Customer (${customerPhone}) ne message bheja: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`,
          is_read: false
        })

      // ─── Fetch Business Settings ────────────────────────
      const { data: settings } = await supabase
        .from('business_settings')
        .select('bot_name, organization_name, language, tone, greeting_message, operating_hours, away_message')
        .eq('business_id', BUSINESS_ID)
        .single()

      // Helper function to check if business is open — handles time windows
      // AND overnight ranges that cross midnight (e.g. 9:00 AM to 3:00 AM).
      function isBusinessOpen(operatingHours: any): boolean {
        if (!operatingHours) return true // default open
        if (operatingHours.always_open) return true // "Always Open (24/7)" toggle in settings

        // Pakistan timezone (UTC+5)
        const now = new Date()
        const pakistanTime = new Date(now.getTime() + (5 * 60 * 60 * 1000))

        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const todayIndex = pakistanTime.getUTCDay()
        const todayName = days[todayIndex]
        const yesterdayName = days[(todayIndex + 6) % 7] // wraps Sunday -> Saturday

        const currentHour = pakistanTime.getUTCHours()
        const currentMin = pakistanTime.getUTCMinutes()
        const currentTotal = currentHour * 60 + currentMin

        function toMinutes(t: string): number {
          const [h, m] = t.split(':').map(Number)
          return h * 60 + m
        }

        // Case 1: yesterday's window crossed midnight and is still running
        // right now (e.g. yesterday was 9AM-3AM and it's currently 1:21AM).
        const yesterdaySettings = operatingHours[yesterdayName]
        if (yesterdaySettings?.enabled) {
          const yOpenTotal = toMinutes(yesterdaySettings.open)
          const yCloseTotal = toMinutes(yesterdaySettings.close)
          if (yCloseTotal < yOpenTotal && currentTotal <= yCloseTotal) {
            return true
          }
        }

        // Case 2: today's own window.
        const daySettings = operatingHours[todayName]
        if (!daySettings || !daySettings.enabled) return false

        const openTotal = toMinutes(daySettings.open)
        const closeTotal = toMinutes(daySettings.close)

        if (closeTotal < openTotal) {
          // Crosses midnight — open from today's open time through to midnight;
          // the after-midnight portion is covered by Case 1 tomorrow morning.
          return currentTotal >= openTotal
        }

        return currentTotal >= openTotal && currentTotal <= closeTotal
      }

      const botName = settings?.bot_name || 'Munshi'
      const orgName = settings?.organization_name || 'Company'
      const language = settings?.language || 'roman_urdu'
      const tone = settings?.tone || 'friendly'

      console.log(`⚙️ Settings - Name: ${botName}, Org: ${orgName}, Lang: ${language}, Tone: ${tone}`)

      const detectedLanguage = (() => {
        const text = messageText;
        if (/[\u0600-\u06FF]/.test(text)) return 'arabic';
        const romanUrduWords = /\b(hai|he|hain|kya|aur|or|nahi|mujhe|apna)\b/i;
        if (romanUrduWords.test(text)) return 'roman_urdu';
        if (/^[A-Za-z0-9\s.,!?-]*$/.test(text)) return 'english';
        return language; // fallback to bot default
      })();

      const languageInstruction =
        detectedLanguage === 'english_us' ? 'Reply in American English' :
          detectedLanguage === 'english_uk' ? 'Reply in British English' :
            detectedLanguage === 'roman_urdu' ? 'Reply in Roman Urdu (Urdu words in English letters)' :
              detectedLanguage === 'arabic' ? 'Reply in Arabic (العربية)' :
                'Reply in English';

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

      const conversationHistory: Message[] = recentMsgs ? recentMsgs.reverse().map(m => ({
        role: (m.sender === 'bot' ? 'assistant' : 'user') as Message['role'],
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
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
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

      // ─── Message Limit Check ───────────────────────────
      const FREE_TIER_LIMIT = 50
      const now = new Date()

      // Step 1: Get subscription (need this first to know the billing period)
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id, plan, messages_limit, valid_until, usage_reset_at')
        .eq('user_id', BUSINESS_ID)
        .order('valid_until', { ascending: false })
        .limit(1)
        .single()

      // Step 2: Work out the current billing-period start (monthly reset)
      // Was: counted bot messages since the beginning of time, forever. Now: resets every 30 days.
      let periodStart = sub?.usage_reset_at ? new Date(sub.usage_reset_at) : new Date(0)
      const daysSinceReset = (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)

      if (sub && daysSinceReset >= 30) {
        periodStart = now
        await supabase
          .from('subscriptions')
          .update({ usage_reset_at: now.toISOString(), messages_used: 0 })
          .eq('id', sub.id)
        console.log('🔄 Monthly usage reset triggered for this business')
      }

      // Step 3: Subscription expired? Fall back to free-tier limit instead of the paid one.
      const isExpired = !!(sub?.valid_until && new Date(sub.valid_until) < now)
      if (isExpired) {
        console.log('⚠️ Subscription expired on', sub!.valid_until, '— using free tier limit until renewed')
      }
      const messagesLimit = isExpired ? 0 : (sub?.messages_limit || FREE_TIER_LIMIT)

      // Step 4: Count bot messages sent THIS PERIOD only (not lifetime)
      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .eq('business_id', BUSINESS_ID)

      const convIds = convs?.map((c: any) => c.id) || []

      let botMsgCount = 0
      if (convIds.length > 0) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', convIds)
          .eq('sender', 'bot')
          .gte('timestamp', periodStart.toISOString())
        botMsgCount = count || 0
      }

      // Step 5: Limit exceeded - send limit message and return
      if (botMsgCount >= messagesLimit) {
        const limitMsg = isExpired
          ? `Assalam o Alaikum! 🙏 Aapka subscription expire ho chuka hai aur free limit (${messagesLimit} messages) bhi poora ho gaya hai. Please renew karein taake bot dobara active ho jaye.`
          : `Asslam o Alaikum! 🙏 Hamara free plan ka limit (${messagesLimit} messages) poora ho gaya hai. Jaldi hi wapas aayenge! Abhi ke liye please directly contact karein.`

        // Send limit message via WhatsApp
        const waRes = await fetch(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: customerPhone,
              type: 'text',
              text: { body: limitMsg }
            })
          }
        )

        const waResult = await waRes.json()
        if (!waRes.ok) {
          console.log('❌ WhatsApp Limit Message Error:', waResult)
        } else {
          console.log('✅ Limit message sent:', limitMsg)
        }

        // Save limit message to database
        const { error: limitError } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender: 'bot',
          content: limitMsg,
          timestamp: new Date().toISOString()
        })

        if (limitError) {
          console.log('❌ Limit message save error:', limitError.message)
        } else {
          console.log('✅ Limit message saved to messages table')
        }

        continue // Skip AI generation and move to next message
      }

      // Step 4: Notification trigger at 80% limit
      if (botMsgCount >= messagesLimit * 0.8) {
        // Check if notification already sent
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('business_id', BUSINESS_ID)
          .eq('type', 'credits_low')
          .limit(1)

        if (!existingNotif || existingNotif.length === 0) {
          await supabase
            .from('notifications')
            .insert({
              business_id: BUSINESS_ID,
              type: 'credits_low',
              title: 'Message Limit Almost Reached!',
              message: `Aap ne ${botMsgCount}/${messagesLimit} messages use kar liye hain. Upgrade karein taake bot band na ho.`,
              is_read: false
            })
          console.log('✅ Credits low notification sent')
        }
      }

      // ─── Generate AI Response ───────────────────────────
      const greeting_message = settings?.greeting_message || 'Hello! How can I help you today?'

      // Prepare messages with explicit typing to satisfy Groq SDK role requirements
      const messages: Message[] = [
        {
          role: 'system', content: `Tu Munshi hai — ${orgName} ka WhatsApp sales agent.
Tera kaam hai customers ki madad karna bilkul ek real Pakistani sales representative ki tarah.

LANGUAGE RULE (SABSE ZAROORI — is se compromise mat karna):
${languageInstruction}
Agar customer Roman Urdu me likhe to Pakistani style follow karo: "apka", "hen", "me" (Hindi spellings jaise "aapka", "hain", "mein" nahi), "ji" use karo "haan" nahi.
Customer jis language me likhe usi me reply karo — bot ki default setting sirf tab use karo jab customer ki language clear na ho.

TONE: ${toneInstruction}

FORMATTING RULE (WhatsApp par tables/headers render nahi hote — is se compromise mat karna):
- Kabhi bhi markdown tables mat banao ( | Category | Product | jaisi cheez)
- Kabhi bhi ### ya ## headers mat use karo
- Sirf *bold* aur _italic_ allowed hai
- Multiple products batane hon to simple bullet lines use karo, e.g.:
  *Curly Fries* — Rs 1,440/packet
  *Waffle Fries* — Rs 1,800/kg
- Ek insaan jaise WhatsApp pe type karta hai, waise likho — table ya spreadsheet jaisa kabhi nahi

PERSONALITY:
- Kabhi bhi robotic mat lagna, natural flow
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

          Greeting: ${greeting_message}`
        },
        ...conversationHistory,
        { role: 'user', content: messageText }
      ];

      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: 'openai/gpt-oss-120b',
        temperature: 0.7,
        max_tokens: 256,
        reasoning_effort: 'medium'
      });

      const aiReply = chatCompletion.choices[0]?.message?.content
      if (!aiReply) continue
      console.log('🤖 AI Reply:', aiReply)

      // ─── Send WhatsApp Response ─────────────────────────
      const waRes = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
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

      // ─── Sync usage counter for dashboard (Account/Billing pages read this
      // column directly — the limit-check above counts messages live, but
      // that count was never being written back here, so the UI stayed at 0) ───
      const { error: usageError } = await supabase
        .from('subscriptions')
        .update({ messages_used: botMsgCount + 1 })
        .eq('user_id', BUSINESS_ID)

      if (usageError) {
        console.log('❌ messages_used sync error:', usageError.message)
      } else {
        console.log(`✅ messages_used synced to ${botMsgCount + 1}`)
      }

      console.log('\n🎉 All steps completed successfully!')
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error: any) {
    console.error('❌ ERROR:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}