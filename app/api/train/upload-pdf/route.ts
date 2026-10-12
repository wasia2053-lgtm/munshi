import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { checkRateLimit } from '../../../../lib/rate-limit'
import { createAdminClient } from '../../../../lib/supabase-server'
import { trainingCache } from '../../../../lib/trainingCache'
import { extractText, getDocumentProxy } from 'unpdf'

// unpdf = serverless-friendly PDF.js build (no native canvas / DOMMatrix needs).
// The previous parser (pdf-parse v2) crashed at import time on Vercel.
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

    const admin = createAdminClient()
    if (!(await checkRateLimit(admin, business_id, 'upload-pdf', 5, 60))) {
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

    // Vercel serverless functions reject request bodies over ~4.5MB before our code
    // even runs, so the real usable limit is 4MB (the UI enforces this too).
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'PDF too large (max 4MB). Please compress it or split it into parts.' }, { status: 400 })
    }

    // PDF se text extract karo (unpdf / PDF.js)
    const arrayBuffer = await file.arrayBuffer()

    let extractedText = ''
    try {
      const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer))
      const { text } = await extractText(pdf, { mergePages: true })
      extractedText = text || ''
    } catch (parseError: any) {
      console.error('[PDF Upload] Parse error:', parseError?.message || parseError)
      return NextResponse.json({
        success: false,
        error: 'Could not read this PDF. It may be password-protected or corrupted — please try a different file.'
      }, { status: 400 })
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

    // Insert the NEW content first, confirm it actually saved, THEN delete the
    // old PDF knowledge — previously this deleted first, so an insert failure
    // right after would have left the customer with no trained PDF data at
    // all. Worst case now (delete fails) is a harmless leftover duplicate,
    // not data loss.
    const { data: inserted, error } = await supabase
      .from('knowledge_base')
      .insert([{
        business_id,
        source_type: 'pdf',
        source_url: file.name,
        content: cleanText,
        chunks_count: chunks,
      }])
      .select('id')
      .single()

    if (error || !inserted) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        success: false,
        error: 'Something went wrong. Please try again.'
      }, { status: 500 })
    }

    const { error: cleanupError } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('business_id', business_id)
      .eq('source_url', file.name)
      .eq('source_type', 'pdf')
      .neq('id', inserted.id)

    if (cleanupError) {
      console.error('Old PDF cleanup failed (non-fatal, new data is safe):', cleanupError.message)
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

    trainingCache.invalidate(business_id)
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