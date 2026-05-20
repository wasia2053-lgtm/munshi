import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { text, title } = body

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
        business_id,
        source_type: 'text',
        source_url: title || 'Manual Entry',
        content: text,
        chunks_count: chunks,
      }])

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ success: false, error: 'Failed to save: ' + error.message }, { status: 500 })
    }


// Training complete notification
await supabase
  .from('notifications')
  .insert({
    business_id,
    type: 'training_complete',
    title: 'Text Training Complete! ✍️',
    message: `Text training complete ho gayi. Bot ab yeh information use karega.`,
    is_read: false
  })

    return NextResponse.json({ success: true, chunks })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'Server error: ' + error.message }, { status: 500 })
  }
}