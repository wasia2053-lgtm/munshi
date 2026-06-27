import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Variant ID → plan config mapping
const VARIANT_PLAN_MAP: Record<string, { plan: string; messages_limit: number }> = {
    '1843727': { plan: 'basic', messages_limit: 1000 },
    '1843743': { plan: 'growth', messages_limit: 5000 },
    '1843744': { plan: 'pro', messages_limit: 50000 },
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret)
    const digest = hmac.update(payload).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

export async function POST(req: NextRequest) {
    const rawBody = await req.text()
    const signature = req.headers.get('x-signature') ?? ''
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!

    // Verify webhook signature
    if (!verifySignature(rawBody, signature, secret)) {
        console.error('[LS Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let event: any
    try {
        event = JSON.parse(rawBody)
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const eventName = event.meta?.event_name
    const data = event.data?.attributes
    const variantId = String(data?.variant_id ?? '')
    const lsCustomerId = String(event.data?.relationships?.customer?.data?.id ?? '')
    const lsSubscriptionId = String(event.data?.id ?? '')
    // user_id passed as custom data when creating checkout
    const userId = event.meta?.custom_data?.user_id

    console.log('[LS Webhook] Event:', eventName, 'User:', userId, 'Variant:', variantId)

    if (!userId) {
        console.error('[LS Webhook] No user_id in custom_data')
        return NextResponse.json({ error: 'No user_id' }, { status: 400 })
    }

    const planConfig = VARIANT_PLAN_MAP[variantId]

    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
        if (!planConfig) {
            console.error('[LS Webhook] Unknown variant:', variantId)
            return NextResponse.json({ error: 'Unknown variant' }, { status: 400 })
        }

        const status = data?.status // 'active' | 'cancelled' | 'expired' | 'past_due'
        const renewsAt = data?.renews_at ?? null

        // Update subscriptions table
        const { error: subError } = await supabase
            .from('subscriptions')
            .update({
                plan: planConfig.plan,
                messages_limit: planConfig.messages_limit,
                messages_used: 0, // reset on new billing cycle
                ls_customer_id: lsCustomerId,
                ls_subscription_id: lsSubscriptionId,
                ls_variant_id: variantId,
                valid_until: renewsAt,
            })
            .eq('user_id', userId)

        if (subError) {
            console.error('[LS Webhook] Sub update error:', subError)
            return NextResponse.json({ error: 'DB error' }, { status: 500 })
        }

        // Insert payment record
        if (eventName === 'subscription_created') {
            const amount = data?.first_subscription_item?.price ?? 0
            await supabase.from('payments').insert({
                user_id: userId,
                plan: planConfig.plan,
                amount: Math.round(amount / 100), // LS sends in cents
                status: 'completed',
                gateway: 'lemonsqueezy',
                reference_number: lsSubscriptionId,
            })
        }

        console.log('[LS Webhook] Subscription activated:', planConfig.plan, 'for user:', userId)
    }

    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
        // Downgrade to starter
        await supabase
            .from('subscriptions')
            .update({
                plan: 'starter',
                messages_limit: 50,
                ls_subscription_id: null,
                ls_variant_id: null,
                valid_until: null,
            })
            .eq('user_id', userId)

        console.log('[LS Webhook] Subscription cancelled for user:', userId)
    }

    return NextResponse.json({ received: true })
}