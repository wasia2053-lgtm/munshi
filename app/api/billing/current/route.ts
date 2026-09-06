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

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !subscription) {
      return NextResponse.json({
        plan: 'starter',
        messages_used: 0,
        messages_limit: 50,
        valid_until: null
      })
    }

    return NextResponse.json({
      plan: subscription.plan,
      messages_used: subscription.messages_used || 0,
      messages_limit: subscription.messages_limit || 50,
      valid_until: subscription.valid_until
    })
  } catch (error) {
    console.error('Current plan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}