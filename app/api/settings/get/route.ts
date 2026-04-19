import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUSINESS_ID = 'dfaa4c16-a081-431a-93d2-ab9ff5637de9'

export async function GET() {
  const { data } = await supabase
    .from('business_settings')
    .select('*')
    .eq('business_id', BUSINESS_ID)
    .single()
  
  return NextResponse.json(data || {})
}
