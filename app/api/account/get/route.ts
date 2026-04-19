import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUSINESS_ID = 'dfaa4c16-a081-431a-93d2-ab9ff5637de9'

export async function GET() {
  const { data: settings } = await supabase
    .from('business_settings')
    .select('*')
    .eq('business_id', BUSINESS_ID)
    .single()

  const { count: msgCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender', 'customer')

  return NextResponse.json({
    name: settings?.organization_name || 'User',
    bot_name: settings?.bot_name || '',
    avatar_url: settings?.avatar_url || null,
    plan: 'free',
    messages_used: msgCount || 0,
    messages_limit: 500,
  })
}
