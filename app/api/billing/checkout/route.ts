import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// Paddle Price IDs (USD) — live mode
const PADDLE_PRICE_IDS: Record<string, string> = {
    basic: 'pri_01kz70m79qzbcxxv4ab8r8q9a5',
    growth: 'pri_01kz70k41x6073ra0z79hvnww7',
    pro: 'pri_01kz70hzqzay5nywzfs8bbd7ps',
}

const PADDLE_API_KEY = process.env.PADDLE_API_KEY!
const PADDLE_API_BASE = process.env.PADDLE_API_BASE || 'https://api.paddle.com'

export async function POST(req: NextRequest) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await req.json()
    return createPaddleCheckout(plan, user)
}

// ---------------- Paddle (USD) ----------------
async function createPaddleCheckout(plan: string, user: { id: string; email?: string }) {
    const priceId = PADDLE_PRICE_IDS[plan]
    if (!priceId) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    try {
        // Paddle Billing "transactions" API creates the transaction; frontend opens
        // Paddle.Checkout.open({ transactionId }) using the client-side token —
        // Paddle Billing has no hosted redirect URL like LS/RG did.
        const res = await fetch(`${PADDLE_API_BASE}/transactions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PADDLE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: [{ price_id: priceId, quantity: 1 }],
                custom_data: { user_id: user.id, plan },
                customer_email: user.email,
            }),
        })

        const data = await res.json()
        if (!res.ok) {
            console.error('[Paddle Checkout] Error:', data)
            return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 })
        }

        return NextResponse.json({ transactionId: data.data.id })
    } catch (err) {
        console.error('[Paddle Checkout] Unexpected error:', err)
        return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 })
    }
}