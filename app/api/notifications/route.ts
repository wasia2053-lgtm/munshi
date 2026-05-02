import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUSINESS_ID = 'dfaa4c16-a081-431a-93d2-ab9ff5637de9'

export async function GET() {
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('business_id', BUSINESS_ID)
    .order('created_at', { ascending: false })

  if (error) {
    console.log('[notifications GET] error:', error)
    return NextResponse.json({ notifications: [], unread_count: 0 })
  }

  const unread_count = notifications?.filter(n => !n.is_read).length || 0

  return NextResponse.json({
    notifications: notifications || [],
    unread_count
  })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { type, title, message } = body

  if (!type || !title || !message) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await supabase
    .from('notifications')
    .insert({
      business_id: BUSINESS_ID,
      type,
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.log('[notifications POST] error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
