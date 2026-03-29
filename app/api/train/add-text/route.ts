import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Helper function to chunk text
function chunkText(text: string, chunkSize: number = 1000): string[] {
  const chunks = []
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize))
  }
  return chunks
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, text, title } = await request.json()

    if (!businessId || !text) {
      return NextResponse.json(
        { error: 'Business ID and text are required' },
        { status: 400 }
      )
    }

    // Validate text
    const trimmedText = text.trim()
    if (trimmedText.length === 0) {
      return NextResponse.json(
        { error: 'Text cannot be empty' },
        { status: 400 }
      )
    }

    if (trimmedText.length > 50000) {
      return NextResponse.json(
        { error: 'Text cannot exceed 50,000 characters' },
        { status: 400 }
      )
    }

    // Chunk the content
    const chunks = chunkText(trimmedText)
    const chunksCount = chunks.length

    // Store in Supabase
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert([
        {
          business_id: businessId,
          source_type: 'text',
          source_url: title || 'Manual Text Entry',
          content: trimmedText,
          chunks_count: chunksCount,
        },
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save training data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Text training added successfully',
      data: data[0],
      chunks: chunksCount,
      contentLength: trimmedText.length,
    })
  } catch (error) {
    console.error('Training error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}