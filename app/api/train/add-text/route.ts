import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ✅ Service role key use karo — RLS bypass hoga
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, text, title } = body

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Business ID required' }, { status: 400 })
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Text required' }, { status: 400 })
    }

    if (text.length > 50000) {
      return NextResponse.json({ success: false, error: 'Text too long (max 50,000 chars)' }, { status: 400 })
    }

    const chunks = Math.ceil(text.length / 1000)

    const { error } = await supabase
      .from('knowledge_base')
      .insert([{
        business_id: businessId,
        source_type: 'text',
        source_url: title || 'Manual Entry',
        content: text,
        chunks_count: chunks,
      }])

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ success: false, error: 'Failed to save: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, chunks })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'Server error: ' + error.message }, { status: 500 })
  }
}