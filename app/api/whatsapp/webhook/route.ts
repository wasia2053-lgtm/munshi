import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Groq from 'groq-sdk'
import crypto from 'crypto'
import { decrypt } from '../../../../lib/crypto'

export const maxDuration = 60 // AI + DB + WhatsApp round trips can take a while — was using Vercel's short default before

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

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
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const hubVerifyToken = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('📥 Webhook verification request')
  console.log('Mode:', mode)
  console.log('Match:', hubVerifyToken === process.env.WHATSAPP_VERIFY_TOKEN)

  if (mode === 'subscribe' && hubVerifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ Webhook verified!')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

function isBusinessOpen(operatingHours: any): boolean {
  if (!operatingHours) return true // default open
  if (operatingHours.always_open) return true // "Always Open (24/7)" toggle in settings

  const now = new Date()
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  function checkDay(date: Date): boolean {
    const dayName = days[date.getDay()]
    const dayConfig = operatingHours[dayName]
    if (!dayConfig || !dayConfig.enabled || !dayConfig.open || !dayConfig.close) return false

    const [openH, openM] = dayConfig.open.split(':').map(Number)
    const [closeH, closeM] = dayConfig.close.split(':').map(Number)
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM
    const nowMinutes = date.getHours() * 60 + date.getMinutes()

    if (closeMinutes < openMinutes) {
      // Overnight window (e.g. 9AM-3AM) — spans midnight
      return nowMinutes >= openMinutes || nowMinutes < closeMinutes
    }
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  return checkDay(now) || checkDay(yesterday)
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

    let hadTransientFailure = false

    if (!body?.entry?.length) {
      return NextResponse.json({ status: 'ok' })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    for (const entry of body.entry) {
      for (const change of entry.changes || []) {
        const messages = change.value?.messages

        if (!messages || messages.length === 0) continue

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

          const FREE_TIER_LIMIT = 50
          const { data: claimResult, error: claimError } = await supabase
            .rpc('claim_and_charge_message', { p_wa_message_id: msg.id, p_business_id: BUSINESS_ID, p_free_limit: FREE_TIER_LIMIT })
            .single() as { data: { claimed: boolean; allowed: boolean; messages_used: number; messages_limit: number; is_expired: boolean } | null, error: any }

          if (claimError || !claimResult) {
            console.log('❌ Claim/usage RPC failed:', claimError?.message)
            hadTransientFailure = true
            continue
          }

          if (!claimResult.claimed) {
            console.log('⚠️ Duplicate message, already claimed/completed — skipping:', msg.id)
            continue
          }

          const { allowed, messages_used: botMsgCount, messages_limit: messagesLimit, is_expired: isExpired } = claimResult

          const customerPhone = msg.from
          const messageText = msg.text.body
          const customerPhoneDigits = customerPhone.replace(/\D/g, '')

          console.log('From:', customerPhone, 'Digits:', customerPhoneDigits)
          console.log('Text:', messageText)

          let { data: conversation, error: selectError } = await supabase
            .from('conversations')
            .select('id')
            .eq('business_id', BUSINESS_ID)
            .eq('customer_phone', customerPhoneDigits)
            .single()

          if (selectError && selectError.code !== 'PGRST116') {
            console.log('Select error:', selectError.message)
            hadTransientFailure = true
            continue
          }

          let conversationId: string

          if (conversation) {
            conversationId = conversation.id
            const { error: updateError } = await supabase
              .from('conversations')
              .update({
                last_message: messageText,
                last_message_time: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', conversationId)

            if (updateError) {
              console.log('Update error:', updateError.message)
              hadTransientFailure = true
              continue
            }
          } else {
            const { data: newConv, error: insertError } = await supabase
              .from('conversations')
              .insert({
                business_id: BUSINESS_ID,
                customer_phone: customerPhoneDigits,
                last_message: messageText,
                last_message_time: new Date().toISOString(),
              })
              .select('id')
              .single()

            if (insertError) {
              if (insertError.code === '23505') {
                const { data: retryConv, error: retrySelectError } = await supabase
                  .from('conversations')
                  .select('id')
                  .eq('business_id', BUSINESS_ID)
                  .eq('customer_phone', customerPhoneDigits)
                  .single()

                if (retrySelectError || !retryConv) {
                  console.log('Insert error after retry:', retrySelectError?.message)
                  hadTransientFailure = true
                  continue
                }
                conversationId = retryConv.id
              } else {
                console.log('Insert error:', insertError.message)
                hadTransientFailure = true
                continue
              }
            } else {
              conversationId = newConv.id
            }
          }

          const { error: incomingError } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender: 'customer',
            content: messageText,
            timestamp: new Date().toISOString(),
          })
          if (incomingError) {
            console.log('❌ Incoming message save error:', incomingError.message)
          } else {
            console.log('✅ Incoming message saved to messages table')
          }

          const { data: settings } = await supabase
            .from('business_settings')
            .select('*')
            .eq('business_id', BUSINESS_ID)
            .single()

          const botName = settings?.bot_name || 'Munshi'
          const toneInstruction = settings?.tone === 'casual' ? 'Casual aur dosti wale andaaz mein baat karo.'
            : settings?.tone === 'professional' ? 'Professional aur formal tareeqe se baat karo.'
              : 'Friendly aur madadgar andaaz mein baat karo.'
          const language = settings?.language || 'roman_urdu'

          if (!isBusinessOpen(settings?.operating_hours)) {
            const awayMsg = settings?.away_message || 'Assalam o alaikum! Abhi hum available nahi hain. Kal business hours mein reply karenge. Shukriya!'

            await fetch(
              `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  to: customerPhone,
                  text: { body: awayMsg },
                }),
              }
            )

            const { error: awayError } = await supabase.from('messages').insert({
              conversation_id: conversationId,
              sender: 'bot',
              content: awayMsg,
              timestamp: new Date().toISOString(),
            })
            if (awayError) {
              console.log('❌ Away message save error:', awayError.message)
            } else {
              console.log('✅ Away message saved to messages table')
            }

            await supabase.from('webhook_processed_messages').update({ status: 'completed' }).eq('wa_message_id', msg.id)
            continue
          }

          if (isExpired) {
            console.log('⚠️ Subscription expired — using free tier limit until renewed')
          }

          if (!allowed) {
            const limitMsg = isExpired
              ? `Assalam o Alaikum! 🙏 Aapka subscription expire ho chuka hai aur free limit (${messagesLimit} messages) bhi poora ho gaya hai. Please renew karein taake bot dobara active ho jaye.`
              : `Asslam o Alaikum! 🙏 Hamara free plan ka limit (${messagesLimit} messages) poora ho gaya hai. Jaldi hi wapas aayenge! Abhi ke liye please directly contact karein.`

            await fetch(
              `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  to: customerPhone,
                  text: { body: limitMsg },
                }),
              }
            )

            const { error: limitError } = await supabase.from('messages').insert({
              conversation_id: conversationId,
              sender: 'bot',
              content: limitMsg,
              timestamp: new Date().toISOString(),
            })
            if (limitError) {
              console.log('❌ Limit message save error:', limitError.message)
            } else {
              console.log('✅ Limit message saved to messages table')
            }

            await supabase.from('webhook_processed_messages').update({ status: 'completed' }).eq('wa_message_id', msg.id)
            continue
          }

          const { data: knowledgeRows } = await supabase
            .from('knowledge_base')
            .select('content')
            .eq('business_id', BUSINESS_ID)
            .in('source_type', ['website', 'pdf', 'text'])
            .limit(15)

          const knowledgeContext = knowledgeRows && knowledgeRows.length > 0
            ? knowledgeRows.map(k => k.content).join('\n\n').substring(0, 6000)
            : 'Koi specific business information available nahi hai abhi.'

          const { data: memPlanRow } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', BUSINESS_ID)
            .single()
          const hasMemoryAccess = memPlanRow?.plan === 'growth' || memPlanRow?.plan === 'pro'

          let conversationHistory: Message[] = []
          if (hasMemoryAccess) {
            const { data: recentMsgs } = await supabase
              .from('messages')
              .select('sender, content, timestamp')
              .eq('conversation_id', conversationId)
              .order('timestamp', { ascending: false })
              .limit(20)

            conversationHistory = recentMsgs ? recentMsgs.reverse().map(m => ({
              role: (m.sender === 'bot' ? 'assistant' : 'user') as Message['role'],
              content: m.content
            })) : []
          }

          const languageInstruction = language === 'english' ? 'English mein jawab do (jab tak customer kisi aur zabaan mein na likhe).'
            : language === 'arabic' ? 'Arabic mein jawab do (jab tak customer kisi aur zabaan mein na likhe).'
              : 'Roman Urdu mein jawab do (jab tak customer kisi aur zabaan mein na likhe).'

          const systemPrompt = `Tum ${botName} ho, ek WhatsApp business assistant.

BUSINESS INFORMATION:
${knowledgeContext}

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
- Insaan jaisa, madadgar, aur seedha jawab do
- ${languageInstruction}
- Agar customer kisi aur language mein likhe, usi language mein jawab do (auto-detect)
- Business information ke bahar ke sawaalon ka honest jawab do ke ye information available nahi hai
- Zyada lamba jawab mat do, WhatsApp ke liye concise raho`

          const messages: Message[] = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: messageText },
          ]

          let aiReply: string | undefined
          try {
            const chatCompletion = await groq.chat.completions.create({
              messages: messages as any,
              model: 'openai/gpt-oss-120b',
              temperature: 0.7,
              max_tokens: 256,
              reasoning_effort: 'medium'
            })
            aiReply = chatCompletion.choices[0]?.message?.content ?? undefined
          } catch (e: any) {
            console.log('❌ Groq error:', e.message)
          }

          if (!aiReply) {
            hadTransientFailure = true
            continue
          }

          const waRes = await fetch(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: customerPhone,
                text: { body: aiReply },
              }),
            }
          )

          const waResult = await waRes.json()
          if (!waRes.ok) {
            console.log('❌ WhatsApp Error:', waResult)
            hadTransientFailure = true
            continue
          }

          console.log('✅ WhatsApp message sent!')
          await supabase.from('webhook_processed_messages').update({ status: 'completed' }).eq('wa_message_id', msg.id)

          const { error: outgoingError } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender: 'bot',
            content: aiReply,
            timestamp: new Date().toISOString(),
          })
          if (outgoingError) {
            console.log('❌ Outgoing message save error:', outgoingError.message)
          } else {
            console.log('✅ Outgoing message saved to messages table')
          }

          console.log('\n🎉 All steps completed successfully!')
        }
      }
    }

    if (hadTransientFailure) {
      console.log('⚠️ One or more messages had a transient failure — returning 500 so Meta retries')
      return NextResponse.json({ status: 'partial failure, retry requested' }, { status: 500 })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error: any) {
    console.error('❌ ERROR:', error.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}