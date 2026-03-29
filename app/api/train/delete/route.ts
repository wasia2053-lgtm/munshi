import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { id, businessId } = await request.json()

    if (!id || !businessId) {
      return NextResponse.json(
        { error: 'ID and Business ID are required' },
        { status: 400 }
      )
    }

    // Verify ownership before deleting
    const { data: training, error: fetchError } = await supabase
      .from('knowledge_base')
      .select('business_id')
      .eq('id', id)
      .single()

    if (fetchError || !training) {
      return NextResponse.json(
        { error: 'Training data not found' },
        { status: 404 }
      )
    }

    if (training.business_id !== businessId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete from Supabase
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete training data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Training data deleted successfully',
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}