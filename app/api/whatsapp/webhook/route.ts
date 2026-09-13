import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import crypto from 'crypto'
import { decrypt } from '../../../../lib/crypto'
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

    if (!body?.entry?.length) {
      return NextResponse.json({ status: 'ok' })
    }

    for (const entry of body.entry) {
      for (const change of entry.changes || []) {
        const messages = change.value?.messages

        if (!messages || messages.length === 0) continue

        // ─── Resolve which business owns this WhatsApp number ──────
        // (was hardcoded before — broke multi-tenant, every message went to one business)
        const phoneNumberId = change.value.metadata?.phone_number_id

        if (!phoneNumberId) {
          console.log('❌ No phone_number_id in webhook payload, skipping this change')
          continue
        }

        const { data: waNumber, error: waNumberError } = await supabase
          .from('whatsapp_numbers')
          .select('business_id, access_token')
          .eq('phone_number_id', phoneNumberId)
          .eq('status', 'connected')
          .single()

        if (waNumberError || !waNumber) {
          console.log('❌ No connected business found for phone_number_id:', phoneNumberId)
          continue
        }

        const BUSINESS_ID = waNumber.business_id

        // Outbound credentials: THIS number's own token only — no silent fallback to a
        // global token. A number with no configured token is a configuration error,
        // not something we guess our way around (that's how wrong-account sends happen).
        if (!waNumber.access_token) {
          console.error('❌ Configuration error: no access_token set for phone_number_id', phoneNumberId, '— refusing to send')
          continue
        }
        let WA_ACCESS_TOKEN: string
        try {
          WA_ACCESS_TOKEN = decrypt(waNumber.access_token)
        } catch (e) {
          console.error('❌ Could not decrypt access_token for phone_number_id', phoneNumberId, '— refusing to send')
          continue
        }

        for (const msg of messages) {
          if (msg.type !== 'text' || !msg.text?.body) continue

          // ─── Claim this message + charge usage — both atomic, both exactly-once ───
          // (Meta retries webhooks on any hiccup — without this, retries = duplicate
          // replies AND duplicate usage charges. A crashed attempt that already
          // charged usage will retry sending WITHOUT charging again.)
          const FREE_TIER_LIMIT = 50
          const { data: claimResult, error: claimError } = await supabase
            .rpc('claim_and_charge_message', { p_wa_message_id: msg.id, p_business_id: BUSINESS_ID, p_free_limit: FREE_TIER_LIMIT })
            .single() as { data: { claimed: boolean; allowed: boolean; messages_used: number; messages_limit: number; is_expired: boolean } | null, error: any }

          if (claimError || !claimResult) {
            console.log('❌ Claim/usage RPC failed:', claimError?.message)
            continue // fail safe — don't reply if we can't verify the claim
          }

          if (!claimResult.claimed) {
            console.log('⚠️ Duplicate message, already claimed/completed — skipping:', msg.id)
            continue
          }

          const { allowed, messages_used: botMsgCount, messages_limit: messagesLimit, is_expired: isExpired } = claimResult

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
              `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
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

            await supabase.from('webhook_processed_messages').update({ status: 'completed' }).eq('wa_message_id', msg.id)
            continue // Skip AI generation and move to next message
          }

          if (isExpired) {
            console.log('⚠️ Subscription expired — using free tier limit until renewed')
          }

          // Limit exceeded - send limit message and return
          if (!allowed) {
            const limitMsg = isExpired
              ? `Assalam o Alaikum! 🙏 Aapka subscription expire ho chuka hai aur free limit (${messagesLimit} messages) bhi poora ho gaya hai. Please renew karein taake bot dobara active ho jaye.`
              : `Asslam o Alaikum! 🙏 Hamara free plan ka limit (${messagesLimit} messages) poora ho gaya hai. Jaldi hi wapas aayenge! Abhi ke liye please directly contact karein.`

            // Send limit message via WhatsApp
            const waRes = await fetch(
              `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
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

            await supabase.from('webhook_processed_messages').update({ status: 'completed' }).eq('wa_message_id', msg.id)
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
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
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
          // ─── Mark completed IMMEDIATELY after the send succeeds — this is the
          // tightest this window can practically get. A crash between the WhatsApp
          // API call succeeding and this single UPDATE committing (network blip,
          // function kill, etc.) is the one scenario where Meta's retry could cause
          // a duplicate reply. This is NOT "exactly-once" — no system coupling an
          // external side-effect (sending to Meta) to local DB state can be truly
          // exactly-once; this is standard "at-least-once with a minimal duplicate
          // window", the same guarantee Stripe/Twilio-style webhook integrations
          // give. Closing it further would require consuming WhatsApp's separate
          // message-status webhooks (sent/delivered) as a second confirmation
          // signal — a larger change, not done here.
          await supabase.from('webhook_processed_messages').update({ status: 'completed' }).eq('wa_message_id', msg.id)

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

          // messages_used is now incremented atomically inside check_and_increment_usage()
          // above, at the moment the message was accepted — no separate sync needed here.

          console.log('\n🎉 All steps completed successfully!')
        }
      } // end for change
    } // end for entry

    return NextResponse.json({ status: 'ok' })
  } catch (error: any) {
    console.error('❌ ERROR:', error.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}