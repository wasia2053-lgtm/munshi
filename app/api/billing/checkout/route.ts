import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// ---- Plan → variant/price mapping ----
const LS_VARIANT_IDS: Record<string, string> = {
    basic: '1843727',
    growth: '1843743',
    pro: '1843744',
}

// PKR prices (paisa-free, whole rupees) — used for Rapid Gateway amount
const PKR_PRICES: Record<string, number> = {
    basic: 1000,
    growth: 7000,
    pro: 30000,
}

const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID!
const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY!

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
    return createLemonSqueezyCheckout(plan, user)
}

// ---------------- LemonSqueezy (USD) ----------------
async function createLemonSqueezyCheckout(plan: string, user: { id: string; email?: string }) {
    const variantId = LS_VARIANT_IDS[plan]
    if (!variantId) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${LS_API_KEY}`,
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json',
        },
        body: JSON.stringify({
            data: {
                type: 'checkouts',
                attributes: {
                    checkout_data: {
                        custom: { user_id: user.id },
                        email: user.email,
                    },
                    product_options: {
                        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=1`,
                    },
                },
                relationships: {
                    store: { data: { type: 'stores', id: LS_STORE_ID } },
                    variant: { data: { type: 'variants', id: variantId } },
                },
            },
        }),
    })

    const data = await response.json()
    if (!response.ok) {
        console.error('[LS Checkout] Error:', data)
        return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 })
    }

    return NextResponse.json({ url: data.data?.attributes?.url })
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
        const orderId = `MUNSHI-${plan.toUpperCase()}-${Date.now()}`
        // TODO: source real customer mobile from business profile/account once stored —
        // gateway requires it, this fallback is a placeholder.
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