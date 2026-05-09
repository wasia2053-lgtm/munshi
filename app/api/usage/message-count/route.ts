import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
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

    // Step 1: Get conversation IDs for this business
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .eq('business_id', business_id)
    
    const convIds = convs?.map(c => c.id) || []
    
    // Step 2: Count bot messages for these conversations
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .eq('sender', 'bot')

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error('Message count error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
