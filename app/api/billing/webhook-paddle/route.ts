import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// ---- Paddle Price ID → plan + messages_limit ----
// MUST match PADDLE_PRICE_IDS in app/api/billing/checkout/route.ts (live mode IDs)
const PRICE_TO_PLAN: Record<string, { plan: string; limit: number }> = {
    pri_01kz70m79qzbcxxv4ab8r8q9a5: { plan: 'basic', limit: 1000 },
    pri_01kz70k41x6073ra0z79hvnww7: { plan: 'growth', limit: 5000 },
    pri_01kz70hzqzay5nywzfs8bbd7ps: { plan: 'pro', limit: 50000 },
}

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET!

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifyPaddleSignature(secret: string, signatureHeader: string, rawBody: string): boolean {
    // Paddle-Signature header format: "ts=<timestamp>;h1=<hex_hmac>"
    const parts = Object.fromEntries(
        signatureHeader.split(';').map((p) => p.split('='))
    ) as { ts?: string; h1?: string }

    if (!parts.ts || !parts.h1) return false

    // reject if timestamp older than 5 minutes
    const nowSec = Math.floor(Date.now() / 1000)
    if (Math.abs(nowSec - Number(parts.ts)) > 300) return false

    const signedPayload = `${parts.ts}:${rawBody}`
    const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')

    const a = Buffer.from(expected)
    const b = Buffer.from(parts.h1)
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
    const rawBody = await req.text()
    const signatureHeader = req.headers.get('paddle-signature')

    if (!signatureHeader) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    if (!verifyPaddleSignature(PADDLE_WEBHOOK_SECRET, signatureHeader, rawBody)) {
        console.error('[Paddle Webhook] Signature mismatch')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    const eventId = event.event_id
    const eventType = event.event_type

    if (eventType === 'transaction.completed') {
        const tx = event.data
        const userId = tx.custom_data?.user_id
        const priceId = tx.items?.[0]?.price?.id
        const amount = tx.details?.totals?.total // in smallest currency unit (cents)

        const planInfo = priceId ? PRICE_TO_PLAN[priceId] : undefined

        if (!userId || !planInfo) {
            console.error('[Paddle Webhook] Missing user_id or unresolved plan', { userId, priceId })
            return NextResponse.json({ ok: true, warning: 'user_id or plan unresolved' })
        }

        const validUntil = new Date()
        validUntil.setDate(validUntil.getDate() + 30)

        // ─── Atomic: payment claim + subscription upgrade, all-or-nothing. ───
        // If two requests race, only ONE gets claimed=true. If the subscription
        // part fails for any reason, the WHOLE thing (including the payment
        // claim) rolls back — so a Paddle retry can genuinely try again instead
        // of the payment being stuck "done" while the plan never upgrades.
        const { data: result, error: processError } = await supabase
            .rpc('process_paddle_payment', {
                p_event_id: eventId,
                p_user_id: userId,
                p_plan: planInfo.plan,
                p_limit: planInfo.limit,
                p_amount: amount ? Number(amount) / 100 : null,
                p_valid_until: validUntil.toISOString(),
            })
            .single() as { data: { claimed: boolean } | null, error: any }

        if (processError) {
            console.error('[Paddle Webhook] Processing failed, will retry on next delivery:', processError.message)
            return NextResponse.json({ ok: false, error: 'processing failed' }, { status: 500 })
        }

        if (!result?.claimed) {
            console.log('[Paddle Webhook] Duplicate event, already processed:', eventId)
            return NextResponse.json({ ok: true, duplicate: true })
        }
    }

    // subscription.canceled — optionally downgrade at period end; left as a no-op
    // for now since valid_until already governs access expiry.

    return NextResponse.json({ ok: true })
}