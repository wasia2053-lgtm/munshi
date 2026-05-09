import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

    // Admin client for business operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch business WhatsApp details
    const { data: business } = await supabase
      .from('businesses')
      .select('whatsapp_phone_id')
      .eq('id', business_id)
      .single()

    if (!business?.whatsapp_phone_id) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 })
    }

    const { phoneNumber } = await req.json()
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    // Format phone number for Meta API
    const formattedPhone = phoneNumber.startsWith('92') ? `+${phoneNumber}` : phoneNumber

    // Send test message via Meta WhatsApp API
    const metaResponse = await fetch(`https://graph.facebook.com/v18.0/${business.whatsapp_phone_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
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
        error: `WhatsApp API error: ${errorData.error?.message || 'Unknown error'}` 
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
