import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)
// ---- Plan → messages_limit (from billing page copy) ----
const PLAN_LIMITS: Record<string, number> = {
    basic: 1000,
    growth: 5000,
    pro: 50000,
}

const RG_WEBHOOK_SALT = process.env.RG_WEBHOOK_SALT!
// During salt rotation, also set this and we'll accept either.
const RG_WEBHOOK_SALT_PREVIOUS = process.env.RG_WEBHOOK_SALT_PREVIOUS

function verifySignature(salt: string, timestamp: string, rawBody: string, signature: string): boolean {
    const expected = crypto
        .createHmac('sha256', salt)
        .update(timestamp + '.' + rawBody)
        .digest('hex')
        .toUpperCase()

    const a = Buffer.from(expected)
    const b = Buffer.from(signature)
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
    // MUST read raw body — do not use req.json() before verifying, signature is over raw bytes
    const rawBody = await req.text()

    const timestamp = req.headers.get('x-rapidgateway-timestamp')
    const signature = req.headers.get('x-rapidgateway-signature')

    if (!timestamp || !signature) {
        return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 })
    }

    // 1. Reject if timestamp older than 5 min
    const nowSec = Math.floor(Date.now() / 1000)
    if (Math.abs(nowSec - Number(timestamp)) > 300) {
        return NextResponse.json({ error: 'Timestamp too old' }, { status: 400 })
    }

    // 2. Verify signature — accept current OR previous salt (rotation window)
    const validCurrent = verifySignature(RG_WEBHOOK_SALT, timestamp, rawBody, signature)
    const validPrevious = RG_WEBHOOK_SALT_PREVIOUS
        ? verifySignature(RG_WEBHOOK_SALT_PREVIOUS, timestamp, rawBody, signature)
        : false

    if (!validCurrent && !validPrevious) {
        console.error('[RG Webhook] Signature mismatch')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 3. Parse payload (now safe, after verification)
    const payload = JSON.parse(rawBody)
    const {
        eventId,
        eventType,
        merchantTransactionId, // e.g. "MUNSHI-BASIC-<user_id>-<timestamp>"
        status,
        amount,
        currency,
    } = payload

    // webhook.test fires from the portal — acknowledge, do nothing
    if (eventType === 'webhook.test') {
        return NextResponse.json({ ok: true })
    }

    // 4. Idempotency — de-dup on eventId, stored in payments.reference_number
    const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('reference_number', eventId)
        .maybeSingle()

    if (existing) {
        // Already processed this event (retry) — no-op, ack it
        return NextResponse.json({ ok: true, duplicate: true })
    }

    if (eventType === 'transaction.completed' && status === 'SUCCESS') {
        // merchantTransactionId format: MUNSHI-{PLAN}-{userId}-{timestamp}
        // NOTE: requires checkout/route.ts to include user.id in BASKET_ID — see accompanying note.
        const parts = String(merchantTransactionId).split('-')
        const plan = parts[1]?.toLowerCase()
        const userId = parts[2]

        if (!plan || !PLAN_LIMITS[plan] || !userId) {
            console.error('[RG Webhook] Could not resolve plan/user', { merchantTransactionId })
            return NextResponse.json({ ok: true, warning: 'plan or user_id unresolved' })
        }

        const validUntil = new Date()
        validUntil.setDate(validUntil.getDate() + 30)

        // SELECT → UPDATE/INSERT pattern (never blind upsert, per project rules)
        const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()

        if (existingSub) {
            await supabase
                .from('subscriptions')
                .update({
                    plan,
                    messages_used: 0,
                    messages_limit: PLAN_LIMITS[plan],
                    valid_until: validUntil.toISOString(),
                })
                .eq('user_id', userId)
        } else {
            await supabase
                .from('subscriptions')
                .insert({
                    user_id: userId,
                    plan,
                    messages_used: 0,
                    messages_limit: PLAN_LIMITS[plan],
                    valid_until: validUntil.toISOString(),
                })
        }

        // Record the payment for idempotency + history
        await supabase.from('payments').insert({
            user_id: userId,
            plan,
            amount,
            status: 'success',
            reference_number: eventId,
            gateway: 'rapid_gateway',
            expires_at: validUntil.toISOString(),
        })
    }

    if (eventType === 'transaction.failed') {
        console.warn('[RG Webhook] Transaction failed', { merchantTransactionId })
        // No subscription change needed — existing plan stays as-is
    }

    // Always ack 2xx once verified + handled, so RG doesn't retry
    return NextResponse.json({ ok: true })
}