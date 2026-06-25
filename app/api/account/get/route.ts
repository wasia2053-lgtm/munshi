import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: settings } = await supabase
      .from('business_settings')
      .select('organization_name, avatar_url')
      .eq('business_id', user.id)
      .single()

    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('plan, messages_limit, messages_used')
      .eq('user_id', user.id)
      .maybeSingle()

    console.log('[account/get] sub:', JSON.stringify(sub), 'subError:', subError?.message, 'user.id:', user.id)

    return NextResponse.json({
      name: settings?.organization_name || null,
      organization_name: settings?.organization_name || null,
      avatar_url: settings?.avatar_url || null,
      email: user.email,
      plan: sub?.plan || 'starter',
      messages_limit: sub?.messages_limit || 50,
      messages_used: sub?.messages_used || 0,
    })
  } catch (err) {
    console.error('Account get error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}