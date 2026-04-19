import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUSINESS_ID = 'dfaa4c16-a081-431a-93d2-ab9ff5637de9'

export async function POST(req: Request) {
  const body = await req.json()
  
  const { error } = await supabase
    .from('business_settings')
    .upsert({
      business_id: BUSINESS_ID,
      organization_name: body.name,
      avatar_url: body.avatar_url,
      updated_at: new Date().toISOString()
    }, { onConflict: 'business_id' })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
