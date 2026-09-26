import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { checkRateLimit } from '../../../../lib/rate-limit'
import { PDFParse } from 'pdf-parse'

// pdf-parse uses pdfjs under the hood — needs real Node APIs, not the Edge runtime.
export const runtime = 'nodejs'

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

    if (!(await checkRateLimit(supabase, business_id, 'upload-pdf', 5, 60))) {
      return NextResponse.json({ error: 'Too many training requests — please wait a minute and try again.' }, { status: 429 })
    }

    // ─── Plan gate: PDF training is Basic plan and above only ───
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', business_id)
      .single()
    if (!sub || sub.plan === 'starter') {
      return NextResponse.json({ success: false, error: 'PDF training is available on the Basic plan and above. Please upgrade to use this feature.' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // PDF se text extract karo — real parser (pdf-parse v2 / pdfjs), regex-guessing nahi
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let extractedText = ''
    let parser: InstanceType<typeof PDFParse> | null = null
    try {
      parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      extractedText = result.text || ''
    } catch (parseError: any) {
      console.error('[PDF Upload] Parse error:', parseError?.message || parseError)
      // Password-protected / corrupt / genuinely unparsable PDF — clear message,
      // not a generic 500, so the user knows it's the file not the server.
      return NextResponse.json({
        success: false,
        error: 'Could not read this PDF. It may be password-protected or corrupted — please try a different file.'
      }, { status: 400 })
    } finally {
      if (parser) await parser.destroy()
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract text from PDF. Make sure it is a text-based PDF (not scanned image).'
      }, { status: 400 })
    }

    const cleanText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    const chunks = Math.ceil(cleanText.length / 1000)

    // Purana delete karo
    await supabase
      .from('knowledge_base')
      .delete()
      .eq('business_id', business_id)
      .eq('source_url', file.name)
      .eq('source_type', 'pdf')

    const { error } = await supabase
      .from('knowledge_base')
      .insert([{
        business_id,
        source_type: 'pdf',
        source_url: file.name,
        content: cleanText,
        chunks_count: chunks,
      }])

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        success: false,
        error: 'Something went wrong. Please try again.'
      }, { status: 500 })
    }

    // Training complete notification
    await supabase
      .from('notifications')
      .insert({
        business_id,
        type: 'training_complete',
        title: 'PDF Training Complete! 📄',
        message: `PDF training complete ho gayi. Bot ab is document se jawab de sakta hai.`,
        is_read: false
      })

    return NextResponse.json({
      success: true,
      chunks,
      message: `PDF trained! ${cleanText.length} characters extracted.`
    })

  } catch (error: any) {
    console.error('PDF upload error:', error)
    return NextResponse.json({
      success: false,
      error: 'Something went wrong. Please try again.'
    }, { status: 500 })
  }
}