import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

type RequestBody = {
  is_resolved: boolean
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  
  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    )
  }

  // 2. Verify request body
  let body: RequestBody
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

  // 3. Verify conversation exists and belongs to user
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

  if (conversation.business_id !== user.id) {
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
      { error: 'Failed to update conversation' }, 
      { status: 500 }
    )
  }

  // 5. Return success
  return NextResponse.json(
    { success: true, is_resolved: body.is_resolved },
    { status: 200 }
  )
}
