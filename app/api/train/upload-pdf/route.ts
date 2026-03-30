import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const businessId = formData.get('businessId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const text = await file.text()
    const chunks = Math.ceil(text.length / 1000)

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert([
        {
          business_id: businessId,
          source_type: 'pdf',
          source_url: file.name,
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