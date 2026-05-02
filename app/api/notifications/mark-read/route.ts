import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUSINESS_ID = 'dfaa4c16-a081-431a-93d2-ab9ff5637de9'

export async function POST(req: Request) {
  const body = await req.json()
  const { id } = body

  let query = supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('business_id', BUSINESS_ID)

  // If specific id provided, only mark that one as read
  // Otherwise mark all as read
  if (id) {
    query = query.eq('id', id)
  }

  const { error } = await query

  if (error) {
    console.log('[notifications/mark-read POST] error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
