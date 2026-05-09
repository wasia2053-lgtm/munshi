import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const business_id = user.id

    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('business_id', business_id)
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