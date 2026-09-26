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
        const paddleSubId = tx.subscription_id ?? null

        const planInfo = priceId ? PRICE_TO_PLAN[priceId] : undefined

        if (!userId || !planInfo) {
            console.error('[Paddle Webhook] Missing user_id or unresolved plan', { userId, priceId })
            return NextResponse.json({ ok: true, warning: 'user_id or plan unresolved' })
        }

        // Prefer Paddle's real billing period end over a guessed +30 days.
        // billing_period is present on subscription-renewal transactions; the
        // very first transaction on some setups may not have it yet, so keep
        // the +30 day fallback for that edge case only.
        const periodEnd = tx.billing_period?.ends_at
        const validUntil = periodEnd ? new Date(periodEnd) : new Date()
        if (!periodEnd) validUntil.setDate(validUntil.getDate() + 30)

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
                p_paddle_subscription_id: paddleSubId,
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

    if (eventType === 'transaction.payment_failed') {
        // No valid_until change here — access simply lapses naturally at the
        // existing valid_until if no new transaction.completed extends it.
        // This branch is purely: flag status for visibility + warn the user
        // so they can fix their card before access actually lapses.
        const tx = event.data
        const userId = tx.custom_data?.user_id

        if (!userId) {
            console.error('[Paddle Webhook] payment_failed with no user_id')
            return NextResponse.json({ ok: true, warning: 'user_id unresolved' })
        }

        const { error: statusError } = await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('user_id', userId)

        if (statusError) {
            console.error('[Paddle Webhook] Failed to set past_due status:', statusError.message)
        }

        const { data: sub } = await supabase
            .from('subscriptions')
            .select('valid_until')
            .eq('user_id', userId)
            .single()

        await supabase.from('notifications').insert({
            business_id: userId,
            type: 'billing',
            title: 'Payment failed',
            message: sub?.valid_until
                ? `Your last payment didn't go through. Please update your payment method before ${new Date(sub.valid_until).toLocaleDateString()} to keep your bot active.`
                : `Your last payment didn't go through. Please update your payment method to keep your bot active.`,
        })

        try {
            const { Resend } = await import('resend')
            const resend = new Resend(process.env.RESEND_API_KEY)
            await resend.emails.send({
                from: 'Munshi Alerts <onboarding@resend.dev>',
                to: process.env.ADMIN_ALERT_EMAIL || 'shahmeershaikh900@gmail.com',
                subject: 'Paddle payment failed',
                html: `<p>A payment failed via Paddle.</p><p><strong>User ID:</strong> ${userId}</p>`,
            })
        } catch (emailError) {
            console.error('[Paddle Webhook] payment_failed alert email failed:', emailError)
        }

        return NextResponse.json({ ok: true })
    }

    if (eventType === 'subscription.updated') {
        // Syncs status for visibility (active / past_due / paused / trialing).
        // Does not touch valid_until — that only changes on a real
        // transaction.completed, so a status flip here can never extend or
        // shorten actual access by itself.
        const sub = event.data
        const userId = sub.custom_data?.user_id
        const status = sub.status // paddle: active | past_due | paused | trialing | canceled

        if (!userId || !status) {
            return NextResponse.json({ ok: true, warning: 'user_id or status unresolved' })
        }

        const { error } = await supabase
            .from('subscriptions')
            .update({ status })
            .eq('user_id', userId)

        if (error) {
            console.error('[Paddle Webhook] subscription.updated sync failed:', error.message)
        }

        return NextResponse.json({ ok: true })
    }

    if (eventType === 'subscription.canceled') {
        // Access still correctly expires via valid_until (already set from the
        // last successful payment) — but the founder-visible status must
        // reflect reality now, not just get an email that's easy to miss.
        const sub = event.data
        const userId = sub.custom_data?.user_id
        console.log('[Paddle Webhook] Subscription canceled for user:', userId)

        if (userId) {
            const { error } = await supabase
                .from('subscriptions')
                .update({ status: 'canceled' })
                .eq('user_id', userId)

            if (error) {
                console.error('[Paddle Webhook] Failed to set canceled status:', error.message)
            }

            await supabase.from('notifications').insert({
                business_id: userId,
                type: 'billing',
                title: 'Subscription canceled',
                message: 'Your subscription has been canceled. Your bot will remain active until your current billing period ends.',
            })
        }

        try {
            const { Resend } = await import('resend')
            const resend = new Resend(process.env.RESEND_API_KEY)
            await resend.emails.send({
                from: 'Munshi Alerts <onboarding@resend.dev>',
                to: process.env.ADMIN_ALERT_EMAIL || 'shahmeershaikh900@gmail.com',
                subject: 'Paddle subscription canceled',
                html: `<p>A subscription was canceled via Paddle.</p><p><strong>User ID:</strong> ${userId || 'unknown'}</p><p>Access will expire naturally at their current valid_until date — no immediate action needed, just visibility.</p>`
            })
        } catch (emailError) {
            console.error('[Paddle Webhook] Cancellation alert email failed:', emailError)
        }

        return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
}