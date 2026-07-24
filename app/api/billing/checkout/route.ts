import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// ---- Plan → Paddle Price ID mapping (sandbox) ----
const PADDLE_PRICE_IDS: Record<string, string> = {
    basic: 'pri_01ky9vtk0gh1yxjj15h31138ct',
    growth: 'pri_01ky9vxrxzs393a6z7srpbn5ne',
    pro: 'pri_01ky9vzy7aanmdqr4141v6dx6c',
}

// PKR prices (paisa-free, whole rupees) — used for Rapid Gateway amount
const PKR_PRICES: Record<string, number> = {
    basic: 1000,
    growth: 7000,
    pro: 30000,
}

const PADDLE_API_KEY = process.env.PADDLE_API_KEY!
// sandbox base — switch to https://api.paddle.com when going live
const PADDLE_API_BASE = process.env.PADDLE_API_BASE || 'https://sandbox-api.paddle.com'

const RG_MERCHANT_ID = process.env.RG_MERCHANT_ID
const RG_CLIENT_SECRET = process.env.RG_CLIENT_SECRET
const RG_MERCHANT_NAME = process.env.RG_MERCHANT_NAME || 'Munshi'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL

export async function POST(req: NextRequest) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, currency, phone } = await req.json()
    // currency: "PKR" | "USD" — sent from billing page toggle. Default USD if missing (back-compat).
    const cur = currency === 'PKR' ? 'PKR' : 'USD'

    if (cur === 'PKR') {
        return createRapidGatewayCheckout(plan, { ...user, phone })
    }
    return createPaddleCheckout(plan, user)
}

// ---------------- Paddle (USD) ----------------
async function createPaddleCheckout(plan: string, user: { id: string; email?: string }) {
    const priceId = PADDLE_PRICE_IDS[plan]
    if (!priceId) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    try {
        // Paddle "transactions" API creates a checkout — we request it in "draft" style
        // by creating a transaction with the price + customer, then hand the
        // transaction id to Paddle.js on the frontend to open the overlay checkout.
        // (Paddle Billing does NOT return a hosted redirect URL like LS/RG do —
        // the frontend must call Paddle.Checkout.open({ transactionId }) using
        // the client-side token. See note below the function.)
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

        // Return the transaction id — frontend opens Paddle's overlay checkout with it
        return NextResponse.json({ transactionId: data.data.id })
    } catch (err) {
        console.error('[Paddle Checkout] Unexpected error:', err)
        return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 })
    }
}

// ---------------- Rapid Gateway (PKR) ----------------
async function createRapidGatewayCheckout(plan: string, user: { id: string; email?: string; phone?: string }) {
    const amount = PKR_PRICES[plan]
    if (!amount) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!RG_MERCHANT_ID || !RG_CLIENT_SECRET) {
        console.warn('[Rapid Gateway] Credentials not set yet')
        return NextResponse.json({ error: 'PKR payments coming online shortly. Contact us on WhatsApp to upgrade now.' }, { status: 503 })
    }

    try {
        // Step 1: Get Bearer token
        const creds = Buffer.from(`${RG_MERCHANT_ID}:${RG_CLIENT_SECRET}`).toString('base64')
        const tokenRes = await fetch('https://secure.rapid-gateway.com/oauth2/token', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${creds}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        })
        const tokenData = await tokenRes.json()
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('[Rapid Gateway] Token error:', tokenData)
            return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 })
        }

        // Step 2: Submit transaction
        // BASKET_ID carries plan + user id + timestamp so the webhook can resolve
        // which business to activate (see app/api/billing/webhook/route.ts).
        const orderId = `MUNSHI-${plan.toUpperCase()}-${user.id}-${Date.now()}`
        const customerMobile = user.phone || '03000000000'

        const body = new URLSearchParams({
            MERCHANT_ID: RG_MERCHANT_ID,
            MERCHANT_NAME: RG_MERCHANT_NAME,
            TXNAMT: String(amount),
            CURRENCY_CODE: 'PKR',
            CUSTOMER_MOBILE_NO: customerMobile,
            CUSTOMER_EMAIL_ADDRESS: user.email || '',
            BASKET_ID: orderId,
            SUCCESS_URL: `${BASE_URL}/dashboard/billing?success=1`,
            FAILURE_URL: `${BASE_URL}/dashboard/billing?failed=1`,
            CHECKOUT_URL: `${BASE_URL}/dashboard/billing`,
            VERSION: 'MY_VER_1.0',
            PROCCODE: '0',
            ORDER_DATE: new Date().toISOString().split('T')[0],
        })

        const payRes = await fetch('https://secure.rapid-gateway.com/rapid/process-transaction', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
            redirect: 'manual', // capture Location header instead of following it
        })

        const redirectUrl = payRes.headers.get('location')
        if (!redirectUrl) {
            console.error('[Rapid Gateway] No redirect URL in response')
            return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 })
        }

        return NextResponse.json({ url: redirectUrl })
    } catch (err) {
        console.error('[Rapid Gateway] Unexpected error:', err)
        return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 })
    }
}