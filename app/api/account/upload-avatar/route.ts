import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // Auth client for user verification
    const cookieStore = await cookies()
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const business_id = user.id

    // Admin client for storage operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const formData = await req.formData()
    const file = formData.get('avatar') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    // ─── Validate: only real images, max 5MB ───
    const ALLOWED_TYPES: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    }
    const ext = ALLOWED_TYPES[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'Only JPG, PNG, WEBP or GIF images are allowed' }, { status: 400 })
    }
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `avatar-${business_id}.${ext}`
    await supabase.storage.createBucket('avatars', { public: true }).catch(() => { })
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, { contentType: file.type, upsert: true })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)

    // avatar_url lives on business_settings, NOT businesses — was silently failing before
    const { error: dbError } = await supabase.from('business_settings')
      .upsert({ business_id, avatar_url: publicUrl })
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    return NextResponse.json({ avatar_url: publicUrl })
  } catch (e) {
    console.error('Avatar upload error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}