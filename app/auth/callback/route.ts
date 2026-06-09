import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    // Exchange code for session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !session?.user) {
      console.error('Auth error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth`)
    }

    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User error:', userError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth`)
    }

    // Check if business_settings exists for this user
    const { data: existingBusiness, error: businessError } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', user.id)
      .single()

    if (businessError && businessError.code !== 'PGRST116') {
      console.error('Business check error:', businessError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth`)
    }

    // If business doesn't exist, create new business
    if (!existingBusiness) {
      // Insert into business_settings table
      const { error: settingsError } = await supabase
        .from('business_settings')
        .insert({
          business_id: user.id,
          bot_name: 'Munshi',
          organization_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
          language: 'roman_urdu',
          tone: 'friendly',
          greeting_message: 'Assalam o Alaikum! Main aapki kaise madad kar sakta hun?'
        })

      if (settingsError) {
        console.error('Business settings insert error:', settingsError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth`)
      }

      // Insert into businesses table
      const { error: businessInsertError } = await supabase
        .from('businesses')
        .insert({
          id: user.id,
          owner_id: user.id,
          name: user.email || '',
        })

      if (businessInsertError) {
        console.error('Business insert error:', businessInsertError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth`)
      }
    }

    // Check if onboarding is complete
    const onboardingDone = existingBusiness?.onboarding_complete === true
    if (!existingBusiness || !onboardingDone) {
      return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
    }
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)

  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth`)
  }
}
