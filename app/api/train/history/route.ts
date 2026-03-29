import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Fetch training history from Supabase
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch training history' },
        { status: 500 }
      )
    }

    // Calculate total statistics
    const totalChunks = data.reduce((sum, item) => sum + (item.chunks_count || 0), 0)
    const totalSize = data.reduce((sum, item) => sum + (item.content?.length || 0), 0)
    const pdfCount = data.filter(item => item.source_type === 'pdf').length
    const textCount = data.filter(item => item.source_type === 'text').length

    return NextResponse.json({
      success: true,
      data,
      stats: {
        totalTrainings: data.length,
        totalChunks,
        totalSize,
        pdfCount,
        textCount,
      },
    })
  } catch (error) {
    console.error('History fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}