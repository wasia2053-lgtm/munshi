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

    // 1. business_settings
    const { data: settings } = await supabase
      .from('business_settings')
      .select('organization_name, avatar_url, bot_name')
      .eq('business_id', user.id)
      .single()

    // 2. subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, messages_limit')
      .eq('user_id', user.id)
      .single()

    // 3. messages count — 2-step (messages table has NO business_id)
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .eq('business_id', user.id)

    let messages_used = 0
    if (convs && convs.length > 0) {
      const convIds = convs.map((c: any) => c.id)

      // Count only bot messages this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .eq('sender', 'bot')
        .gte('timestamp', startOfMonth.toISOString())

      messages_used = count || 0
    }

    return NextResponse.json({
      name: settings?.organization_name || null,
      organization_name: settings?.organization_name || null,
      avatar_url: settings?.avatar_url || null,
      email: user.email,
      plan: sub?.plan || 'starter',
      messages_limit: sub?.messages_limit || 50,
      messages_used,
    })
  } catch (err) {
    console.error('Account get error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}