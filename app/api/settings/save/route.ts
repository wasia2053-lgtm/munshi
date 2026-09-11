import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const business_id = user.id

    const body = await request.json()
    const {
      bot_name,
      organization_name,
      language,
      tone,
      greeting_message,
      operating_hours,
      away_message,
    } = body

    // ─── Plan gate: Operating Hours / Away Message is Basic plan and above ───
    // (matches pricing page — Starter doesn't include this)
    if (operating_hours !== undefined || away_message !== undefined) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', business_id)
        .single()
      if (!sub || sub.plan === 'starter') {
        return NextResponse.json(
          { error: 'Operating Hours is available on the Basic plan and above. Please upgrade to use this feature.' },
          { status: 403 }
        )
      }
    }

    // Settings page saves independently per section (Bot Personality,
    // Operating Hours, Away Message) — each request only sends its own
    // fields. Only include keys that were actually sent, so one section's
    // save doesn't blank out the others.
    const updatePayload: Record<string, any> = {
      business_id,
      updated_at: new Date().toISOString(),
    }
    if (bot_name !== undefined) updatePayload.bot_name = bot_name
    if (organization_name !== undefined) updatePayload.organization_name = organization_name
    if (language !== undefined) updatePayload.language = language
    if (tone !== undefined) updatePayload.tone = tone
    if (greeting_message !== undefined) updatePayload.greeting_message = greeting_message
    if (operating_hours !== undefined) updatePayload.operating_hours = operating_hours
    if (away_message !== undefined) updatePayload.away_message = away_message

    const { data, error } = await supabase
      .from('business_settings')
      .upsert(updatePayload, { onConflict: 'business_id' })
      .select()
      .single()

    if (error) {
      console.log('❌ Settings save error:', error.message)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }

    console.log('✅ Settings saved!')
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Settings save exception:', error.message)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

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
    const business_id = user.id

    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', business_id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Settings fetch error:', error.message)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || null })
  } catch (error: any) {
    console.error('Settings fetch exception:', error.message)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}