import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { decrypt } from '@/lib/crypto'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const business_id = user.id

    if (!(await checkRateLimit(authClient, business_id, 'whatsapp-test', 5, 60))) {
      return NextResponse.json({ error: 'Too many requests — please wait a minute and try again.' }, { status: 429 })
    }

    // Admin client for business operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch business WhatsApp details — was reading from businesses table (missing for most users)
    const { data: waNumber } = await supabase
      .from('whatsapp_numbers')
      .select('phone_number_id, access_token')
      .eq('business_id', business_id)
      .eq('is_primary', true)
      .single()

    if (!waNumber?.phone_number_id || !waNumber?.access_token) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 })
    }
    let waToken: string
    try {
      waToken = decrypt(waNumber.access_token)
    } catch {
      return NextResponse.json({ error: 'Could not decrypt stored credentials' }, { status: 500 })
    }

    const { phoneNumber } = await req.json()
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    // Format phone number for Meta API
    const formattedPhone = phoneNumber.startsWith('92') ? `+${phoneNumber}` : phoneNumber

    // Send test message via Meta WhatsApp API
    const metaResponse = await fetch(`https://graph.facebook.com/v21.0/${waNumber.phone_number_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${waToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'test_message',
          language: {
            code: 'en'
          },
          components: [{
            type: 'body',
            parameters: [{
              type: 'text',
              text: 'This is a test message from Munshi WhatsApp bot!'
            }]
          }]
        }
      })
    })

    if (!metaResponse.ok) {
      const errorData = await metaResponse.json()
      console.error('Meta API error:', errorData)
      return NextResponse.json({
        error: 'Failed to send test message. Please check your WhatsApp connection and try again.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Test message sent successfully'
    })

  } catch (error) {
    console.error('WhatsApp test error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}