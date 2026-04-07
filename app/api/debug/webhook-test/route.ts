import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  console.log('\n=== DEBUG: ENVIRONMENT CHECK ===')
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
  console.log('SUPABASE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')
  console.log('WHATSAPP_PHONE_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? 'SET' : 'MISSING')
  console.log('WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? 'SET' : 'MISSING')
  console.log('=====================================\n')

  return NextResponse.json({
    environment: 'checked',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let supabaseConnected = false
  let insertError: string | null = null

  try {
    console.log('\n=== DEBUG: WEBHOOK TEST START ===')
    
    // Log entire request body
    const body = await request.json()
    console.log('REQUEST BODY:', JSON.stringify(body, null, 2))
    console.log('REQUEST HEADERS:', Object.fromEntries(request.headers.entries()))

    // Test Supabase connection with insert
    console.log('\nTESTING SUPABASE INSERT...')
    
    const testData = {
      business_id: 'debug-test',
      customer_phone: '+1234567890',
      message_text: 'Debug test message',
      message_type: 'debug',
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert(testData)
      .select()

    if (error) {
      console.log('SUPABASE ERROR:', error)
      insertError = error.message
      supabaseConnected = false
    } else {
      console.log('SUPABASE SUCCESS:', data)
      supabaseConnected = true
    }

    const response = {
      received: true,
      supabaseConnected,
      insertError,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime
    }

    console.log('RESPONSE:', JSON.stringify(response, null, 2))
    console.log('=== DEBUG: WEBHOOK TEST END ===\n')

    return NextResponse.json(response)

  } catch (error: any) {
    console.log('CATCH ERROR:', error.message)
    
    return NextResponse.json({
      received: false,
      supabaseConnected: false,
      insertError: error.message,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime
    })
  }
}
