import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUSINESS_ID = 'dfaa4c16-a081-431a-93d2-ab9ff5637de9'

export async function POST(req: Request) {
  const body = await req.json()
  const { name, avatar_url } = body

  const updateData: any = {}
  if (name !== undefined) updateData.organization_name = name
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url

  const { error } = await supabase
    .from('business_settings')
    .update(updateData)
    .eq('business_id', BUSINESS_ID)

  console.log('[account/update] updateData:', updateData, 'error:', error)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
