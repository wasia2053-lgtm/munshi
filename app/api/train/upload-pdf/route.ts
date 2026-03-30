import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const businessId = formData.get('businessId') as string

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Business ID required' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // PDF se text extract karo — binary safe method
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    
    // PDF text extraction — strings dhundo PDF binary mein
    const extractedText = extractTextFromPDFBytes(bytes)

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
      .eq('business_id', businessId)
      .eq('source_url', file.name)
      .eq('source_type', 'pdf')

    const { error } = await supabase
      .from('knowledge_base')
      .insert([{
        business_id: businessId,
        source_type: 'pdf',
        source_url: file.name,
        content: cleanText,
        chunks_count: chunks,
      }])

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save: ' + error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      chunks,
      message: `PDF trained! ${cleanText.length} characters extracted.`
    })

  } catch (error: any) {
    console.error('PDF upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error: ' + error.message 
    }, { status: 500 })
  }
}

// ── PDF bytes se readable text extract karo ──
function extractTextFromPDFBytes(bytes: Uint8Array): string {
  // PDF binary ko Latin-1 string mein convert karo
  let pdfString = ''
  for (let i = 0; i < bytes.length; i++) {
    pdfString += String.fromCharCode(bytes[i])
  }

  const texts: string[] = []

  // Method 1: BT...ET blocks (standard PDF text)
  const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g
  let btMatch
  while ((btMatch = btEtRegex.exec(pdfString)) !== null) {
    const block = btMatch[1]
    // Extract strings from Tj, TJ, ' operators
    const strRegex = /\(([^)]*)\)\s*(?:Tj|'|")/g
    let strMatch
    while ((strMatch = strRegex.exec(block)) !== null) {
      const decoded = decodePDFString(strMatch[1])
      if (decoded.trim()) texts.push(decoded)
    }
    // TJ arrays
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g
    let tjMatch
    while ((tjMatch = tjArrayRegex.exec(block)) !== null) {
      const arrayContent = tjMatch[1]
      const innerStrRegex = /\(([^)]*)\)/g
      let innerMatch
      while ((innerMatch = innerStrRegex.exec(arrayContent)) !== null) {
        const decoded = decodePDFString(innerMatch[1])
        if (decoded.trim()) texts.push(decoded)
      }
    }
  }

  // Method 2: stream blocks (fallback)
  if (texts.length === 0) {
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
    let streamMatch
    while ((streamMatch = streamRegex.exec(pdfString)) !== null) {
      const streamContent = streamMatch[1]
      const printable = streamContent
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (printable.length > 30) {
        const words = printable.split(' ').filter(w => w.length > 2 && /[a-zA-Z]/.test(w))
        if (words.length > 10) texts.push(words.join(' '))
      }
    }
  }

  return texts.join(' ')
}

// ── PDF string escapes decode karo ──
function decodePDFString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
}