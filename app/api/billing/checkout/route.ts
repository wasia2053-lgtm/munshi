import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const VARIANT_IDS: Record<string, string> = {
    basic: '1843727',
    growth: '1843743',
    pro: '1843744',
}

const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID!
const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY!

export async function POST(req: NextRequest) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await req.json()
    const variantId = VARIANT_IDS[plan]

    if (!variantId) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Create LS checkout with user_id in custom_data
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
                        custom: {
                            user_id: user.id,
                        },
                        email: user.email,
                    },
                    product_options: {
                        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=1`,
                    },
                },
                relationships: {
                    store: {
                        data: { type: 'stores', id: LS_STORE_ID },
                    },
                    variant: {
                        data: { type: 'variants', id: variantId },
                    },
                },
            },
        }),
    })

    const data = await response.json()

    if (!response.ok) {
        console.error('[LS Checkout] Error:', data)
        return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 })
    }

    const checkoutUrl = data.data?.attributes?.url
    return NextResponse.json({ url: checkoutUrl })
}