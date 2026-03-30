import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, text, title } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 })
    }

    if (text.length > 50000) {
      return NextResponse.json({ error: 'Text too long' }, { status: 400 })
    }

    const chunks = Math.ceil(text.length / 1000)

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert([
        {
          business_id: businessId,
          source_type: 'text',
          source_url: title || 'Manual Entry',
          content: text,
          chunks_count: chunks,
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      chunks: chunks,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}