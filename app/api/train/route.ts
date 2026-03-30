import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { url, businessId } = await req.json()

    if (!url || !businessId) {
      return NextResponse.json({ success: false, error: 'URL and businessId required' }, { status: 400 })
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid URL format' }, { status: 400 })
    }

    // Fetch website content
    let htmlContent = ''
    try {
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MunshiBot/1.0)',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      })

      if (!response.ok) {
        return NextResponse.json({ 
          success: false, 
          error: `Website returned ${response.status} — check URL` 
        }, { status: 400 })
      }

      htmlContent = await response.text()
    } catch (fetchError: any) {
      return NextResponse.json({ 
        success: false, 
        error: `Could not reach website: ${fetchError.message}` 
      }, { status: 400 })
    }

    // Extract clean text from HTML
    const cleanText = extractTextFromHtml(htmlContent)

    if (!cleanText || cleanText.length < 50) {
      return NextResponse.json({ 
        success: false, 
        error: 'Could not extract enough content from website' 
      }, { status: 400 })
    }

    // Split into chunks (max 1500 chars each)
    const chunks = splitIntoChunks(cleanText, 1500)

    // Delete old data for this URL + business (re-training)
    await supabase
      .from('knowledge_base')
      .delete()
      .eq('business_id', businessId)
      .eq('source_url', url)
      .eq('source_type', 'website')

    // Insert new chunks
    const inserts = chunks.map((chunk, index) => ({
      business_id: businessId,
      source_type: 'website',
      source_url: url,
      content: chunk,
      chunks_count: chunks.length,
      created_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from('knowledge_base')
      .insert(inserts)

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save training data' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Website trained successfully!`,
      chunks: chunks.length,
      contentLength: cleanText.length,
      url: url,
    })

  } catch (error: any) {
    console.error('Training error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error' 
    }, { status: 500 })
  }
}

// ── Helper: Extract readable text from HTML ──
function extractTextFromHtml(html: string): string {
  // Remove scripts, styles, nav, footer, head
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, ' ')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/gi, ' ')
    // Convert block elements to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    // Remove all remaining tags
    .replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Clean whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return text
}

// ── Helper: Split text into chunks ──
function splitIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = []
  const paragraphs = text.split('\n\n')
  let current = ''

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue

    if ((current + '\n\n' + trimmed).length > maxLength) {
      if (current.trim()) chunks.push(current.trim())
      current = trimmed
    } else {
      current = current ? current + '\n\n' + trimmed : trimmed
    }
  }

  if (current.trim()) chunks.push(current.trim())

  // If any chunk is still too long, split by sentences
  const finalChunks: string[] = []
  for (const chunk of chunks) {
    if (chunk.length <= maxLength) {
      finalChunks.push(chunk)
    } else {
      const sentences = chunk.split(/(?<=[.!?])\s+/)
      let subChunk = ''
      for (const sentence of sentences) {
        if ((subChunk + ' ' + sentence).length > maxLength) {
          if (subChunk.trim()) finalChunks.push(subChunk.trim())
          subChunk = sentence
        } else {
          subChunk = subChunk ? subChunk + ' ' + sentence : sentence
        }
      }
      if (subChunk.trim()) finalChunks.push(subChunk.trim())
    }
  }

  return finalChunks.filter(c => c.length > 20)
}