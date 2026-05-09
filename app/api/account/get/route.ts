import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('[account/get] called')
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    console.log('[account/get] user.id:', user.id)
    console.log('[account/get] user.email:', user.email)

    const { data, error } = await supabase
      .from('business_settings')
      .select('organization_name, avatar_url, bot_name')
      .eq('business_id', user.id)
      .single()

    console.log('[account/get] business_settings result:', JSON.stringify(data), 'error:', error?.message)

    if (error && error.code === 'PGRST116') {
      // No rows found - create empty row
      console.log('[account/get] No business_settings row found, creating empty row for business_id:', user.id)
      
      const { data: insertData, error: insertError } = await supabase
        .from('business_settings')
        .insert({
          business_id: user.id,
          organization_name: null,
          avatar_url: null,
          bot_name: null
        })
        .select()
        .single()

      if (insertError) {
        console.error('[account/get] Failed to insert business_settings:', insertError)
        return NextResponse.json({ 
          organization_name: null, 
          avatar_url: null, 
          email: user.email 
        })
      }

      console.log('[account/get] Created business_settings row:', JSON.stringify(insertData))
      
      return NextResponse.json({
        organization_name: insertData.organization_name,
        avatar_url: insertData.avatar_url,
        email: user.email
      })
    }

    if (error || !data) {
      console.error('[account/get] Business settings fetch error:', error)
      return NextResponse.json({ 
        organization_name: null, 
        avatar_url: null, 
        email: user.email 
      })
    }

    console.log('[account/get] Final response:', {
      organization_name: data.organization_name,
      avatar_url: data.avatar_url,
      email: user.email
    })

    return NextResponse.json({
      organization_name: data.organization_name,
      avatar_url: data.avatar_url,
      email: user.email
    })
  } catch (error) {
    console.error('Account get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
