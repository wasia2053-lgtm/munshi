import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  console.log('\n🧪 [DIAGNOSTIC] Starting health check...\n')

  const results = {
    timestamp: new Date().toISOString(),
    checks: {} as any
  }

  // Check 1: Environment variables
  console.log('1️⃣ [ENV] Checking environment variables...')
  results.checks.env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    WHATSAPP_ACCESS_TOKEN: !!process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_VERIFY_TOKEN: !!process.env.WHATSAPP_VERIFY_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  }
  console.log('   Result:', results.checks.env)

  // Check 2: Supabase Connection
  console.log('\n2️⃣ [SUPABASE] Testing connection...')
  try {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('count')
      .limit(1)

    if (error) {
      results.checks.supabase = { status: 'ERROR', message: error.message }
      console.log('   ❌ Error:', error.message)
    } else {
      results.checks.supabase = { status: 'OK', message: 'Connected' }
      console.log('   ✅ Connected successfully')
    }
  } catch (error: any) {
    results.checks.supabase = { status: 'ERROR', message: error.message }
    console.log('   ❌ Connection failed:', error.message)
  }

  // Check 3: Database Tables
  console.log('\n3️⃣ [TABLES] Checking tables...')
  const tables = ['conversations', 'messages', 'knowledge_base', 'business_settings']
  results.checks.tables = {}

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)

      if (error) {
        results.checks.tables[table] = 'MISSING'
        console.log(`   ❌ ${table}: Missing`)
      } else {
        results.checks.tables[table] = 'OK'
        console.log(`   ✅ ${table}: Found`)
      }
    } catch (error: any) {
      results.checks.tables[table] = 'ERROR'
      console.log(`   ❌ ${table}: Error - ${error.message}`)
    }
  }

  // Check 4: RLS Policies
  console.log('\n4️⃣ [RLS] Checking Row Level Security...')
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .limit(1)

    if (error && error.message.includes('row level security')) {
      results.checks.rls = 'ENABLED_MAY_BLOCK'
      console.log('   ⚠️  RLS is enabled - may be blocking queries')
    } else if (error) {
      results.checks.rls = 'ERROR: ' + error.message
      console.log('   ❌ Error:', error.message)
    } else {
      results.checks.rls = 'OK'
      console.log('   ✅ RLS check passed')
    }
  } catch (error: any) {
    results.checks.rls = 'ERROR: ' + error.message
  }

  // Check 5: Sample Data
  console.log('\n5️⃣ [DATA] Checking sample data...')
  try {
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(5)

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .limit(5)

    const { data: training, error: trainError } = await supabase
      .from('knowledge_base')
      .select('*')
      .limit(5)

    results.checks.data = {
      conversations: conversations?.length || 0,
      messages: messages?.length || 0,
      training: training?.length || 0
    }

    console.log('   Conversations:', conversations?.length || 0)
    console.log('   Messages:', messages?.length || 0)
    console.log('   Training:', training?.length || 0)
  } catch (error: any) {
    results.checks.data = { error: error.message }
    console.log('   ❌ Error fetching data')
  }

  console.log('\n🧪 [DIAGNOSTIC] Health check complete!')
  console.log('═══════════════════════════════════════════\n')

  return NextResponse.json(results, { status: 200 })
}