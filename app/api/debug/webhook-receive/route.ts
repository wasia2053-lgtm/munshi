
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const hubChallenge = searchParams.get('hub.challenge')
  
  console.log('WEBHOOK RECEIVE DEBUG - GET')
  console.log('hub.challenge:', hubChallenge)
  
  if (hubChallenge) {
    return new NextResponse(hubChallenge)
  }
  
  return NextResponse.json({ status: 'ok' })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('\n=== WEBHOOK RECEIVE DEBUG - POST ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Headers:', Object.fromEntries(request.headers.entries()))
    console.log('Body:', JSON.stringify(body, null, 2))
    console.log('=====================================\n')
    
    return NextResponse.json({ status: 'received' })
    
  } catch (error: any) {
    console.log('WEBHOOK RECEIVE DEBUG ERROR:', error.message)
    return NextResponse.json({ status: 'error', error: error.message })
  }
}
