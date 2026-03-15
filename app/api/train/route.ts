import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { url, businessId } = await request.json()

    if (!url || !businessId) {
      return NextResponse.json(
        { error: 'URL and businessId are required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch webpage content
    let htmlContent = ''
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch webpage: ${response.status}` },
          { status: 400 }
        )
      }
      
      htmlContent = await response.text()
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch webpage content' },
        { status: 500 }
      )
    }

    // Extract text content (remove HTML tags)
    const textContent = htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim()

    if (!textContent) {
      return NextResponse.json(
        { error: 'No content could be extracted from the webpage' },
        { status: 400 }
      )
    }

    // Save to Supabase knowledge_base table
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        business_id: businessId,
        source_type: 'website',
        source_url: url,
        content: textContent,
        chunks_count: 1,
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { error: 'Failed to save training data', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Training complete',
      data: {
        businessId,
        url,
        contentLength: textContent.length,
        chunks_count: 1
      }
    })

  } catch (error) {
    console.error('Training API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
