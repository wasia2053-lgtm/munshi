import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUSINESS_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bot_name, language, tone, organization_name, greeting_message } = body

    const { data, error } = await supabase
      .from('business_settings')
      .upsert({
        business_id: BUSINESS_ID,
        bot_name,
        language,
        tone,
        organization_name,
        greeting_message,
        updated_at: new Date().toISOString()
      }, { onConflict: 'business_id' })
      .select()
      .single()

    if (error) {
      console.log('❌ Settings save error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Settings saved!')
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', BUSINESS_ID)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || null })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}