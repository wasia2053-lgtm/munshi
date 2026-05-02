import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUSINESS_ID = 'dfaa4c16-a081-431a-93d2-ab9ff5637de9'

export async function GET() {
  console.log('[account/get] called')
  
  const { data, error } = await supabase
    .from('business_settings')
    .select('organization_name, avatar_url, bot_name')
    .eq('business_id', BUSINESS_ID)
    .single()

  console.log('[account/get] result:', JSON.stringify(data), 'error:', error?.message)

  if (error || !data) {
    return NextResponse.json({ name: '', avatar_url: null })
  }

  return NextResponse.json({
    name: data.organization_name || '',
    avatar_url: data.avatar_url || null,
  })
}
