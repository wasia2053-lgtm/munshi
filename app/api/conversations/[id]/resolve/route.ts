import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Get session from cookies
  const cookieStore = cookies()
  const supabase = createServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    )
  }

  // 2. Validate body
  let body: { is_resolved?: boolean }
  try {
    body = await request.json()
    if (typeof body.is_resolved !== 'boolean') {
      throw new Error('Invalid payload')
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' }, 
      { status: 400 }
    )
  }

  // 3. Verify conversation ownership
  const { data: conversation, error: fetchError } = await supabase
    .from('conversations')
    .select('id, business_id')
    .eq('id', params.id)
    .single()
  
  if (fetchError || !conversation) {
    return NextResponse.json(
      { error: 'Conversation not found' }, 
      { status: 404 }
    )
  }

  // business_id must match authenticated user
  if (conversation.business_id !== session.user.id) {
    return NextResponse.json(
      { error: 'Forbidden' }, 
      { status: 403 }
    )
  }

  // 4. Update conversation
  const { error: updateError } = await supabase
    .from('conversations')
    .update({ 
      is_resolved: body.is_resolved,
      updated_at: new Date().toISOString() 
    })
    .eq('id', params.id)
  
  if (updateError) {
    return NextResponse.json(
      { error: 'Database update failed' }, 
      { status: 500 }
    )
  }

  // 5. Return success
  return NextResponse.json(
    { success: true, is_resolved: body.is_resolved },
    { status: 200 }
  )
}
