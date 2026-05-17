import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { plan, reference_number } = body

    if (!plan || !reference_number) {
      return NextResponse.json({ error: 'Plan and reference number are required' }, { status: 400 })
    }

    const planAmounts: { [key: string]: number } = {
      growth: 7000,
      pro: 30000
    }

    const amount = planAmounts[plan]
    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const { error } = await supabase.from('payments').insert({
      user_id: user.id,
      plan,
      amount,
      status: 'pending',
      reference_number
    })

    if (error) {
      console.error('Payment insert error:', error)
      return NextResponse.json({ error: 'Failed to submit upgrade request' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Upgrade error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
