import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }

    const stats = {
      totalTrainings: data.length,
      pdfCount: data.filter((d: any) => d.source_type === 'pdf').length,
      textCount: data.filter((d: any) => d.source_type === 'text').length,
      totalChunks: data.reduce((sum: number, d: any) => sum + (d.chunks_count || 0), 0),
      totalSize: data.reduce((sum: number, d: any) => sum + (d.content?.length || 0), 0),
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      stats,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}