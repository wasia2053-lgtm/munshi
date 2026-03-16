import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { url, userId } = await request.json()

    if (!url || !userId) {
      return NextResponse.json(
        { error: 'URL and userId are required' },
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

    // Check if business exists for this user, create if not
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', userId)
      .single()

    console.log('Step 1 - Finding business:', businessData, businessError)

    let businessId = businessData?.id

    if (!businessId) {
      const { data: newBusiness, error: createError } = await supabase
        .from('businesses')
        .insert({ user_id: userId, name: 'My Store' })
        .select('id')
        .single()
      
      console.log('Step 2 - Creating business:', newBusiness, createError)
      
      if (createError) {
        return NextResponse.json({ 
          error: createError.message || 'Failed to create business',
          details: createError 
        }, { status: 500 })
      }
      
      businessId = newBusiness?.id
    }

    if (!businessId) {
      return NextResponse.json(
        { error: 'Failed to create business' },
        { status: 500 }
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
    const { data: insertData, error: insertError } = await supabase
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

    console.log('Step 3 - Inserting knowledge:', insertData, insertError)

    if (insertError) {
      console.error('Supabase error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      return NextResponse.json({ 
        error: insertError.message || 'Failed to save training data',
        details: insertError 
      }, { status: 500 })
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

  } catch (error: any) {
    console.error('Training API Error:', error)
    return NextResponse.json({
      error: error?.message || 'Unknown error',
      details: String(error)
    }, { status: 500 })
  }
}
