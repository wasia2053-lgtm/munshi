import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import * as pdfParse from 'pdf-parse'

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
    const formData = await request.formData()
    const file = formData.get('file') as File
    const businessId = formData.get('businessId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse PDF
    let pdfData
    try {
      pdfData = await pdfParse(buffer)
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse PDF' },
        { status: 400 }
      )
    }

    const content = pdfData.text
    
    if (!content.trim()) {
      return NextResponse.json(
        { error: 'PDF appears to be empty' },
        { status: 400 }
      )
    }

    // Chunk the content
    const chunks = chunkText(content)
    const chunksCount = chunks.length

    // Store in Supabase
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert([
        {
          business_id: businessId,
          source_type: 'pdf',
          source_url: file.name,
          content: content,
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
      message: 'PDF uploaded successfully',
      data: data[0],
      chunks: chunksCount,
      contentLength: content.length,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}