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

        // ─── Atomic claim: only ONE concurrent delivery of this exact event can
        // ever get a row back here. If two requests race, the loser's `data`
        // comes back empty and it skips straight to returning ok — no double
        // subscription update, no duplicate payment row. ───
        const { data: claimedRows, error: claimError } = await supabase
            .from('payments')
            .upsert(
                {
                    user_id: userId,
                    plan: planInfo.plan,
                    amount: amount ? Number(amount) / 100 : null,
                    status: 'completed',
                    reference_number: eventId,
                    gateway: 'paddle',
                    expires_at: validUntil.toISOString(),
                },
                { onConflict: 'reference_number', ignoreDuplicates: true }
            )
            .select()

        if (claimError) {
            console.error('[Paddle Webhook] Claim error:', claimError.message)
            return NextResponse.json({ ok: true, warning: 'claim failed' })
        }

        if (!claimedRows || claimedRows.length === 0) {
            console.log('[Paddle Webhook] Duplicate event, already processed:', eventId)
            return NextResponse.json({ ok: true, duplicate: true })
        }

        const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()

        if (existingSub) {
            await supabase
                .from('subscriptions')
                .update({
                    plan: planInfo.plan,
                    messages_used: 0,
                    messages_limit: planInfo.limit,
                    valid_until: validUntil.toISOString(),
                })
                .eq('user_id', userId)
        } else {
            await supabase
                .from('subscriptions')
                .insert({
                    user_id: userId,
                    plan: planInfo.plan,
                    messages_used: 0,
                    messages_limit: planInfo.limit,
                    valid_until: validUntil.toISOString(),
                })
        }
    }

    // subscription.canceled — optionally downgrade at period end; left as a no-op
    // for now since valid_until already governs access expiry.

    return NextResponse.json({ ok: true })
}