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

    // ─── Magic-byte check: file.type is just a client-sent label, easy to
    // spoof (rename a .html/.svg/anything to .jpg). Verify the actual first
    // bytes of the file match a real image of the claimed type before we
    // trust it and store it. ───
    function matchesImageSignature(buf: Buffer, declaredType: string): boolean {
      if (buf.length < 12) return false
      switch (declaredType) {
        case 'image/jpeg':
          return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
        case 'image/png':
          return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
            buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
        case 'image/gif':
          return buf.toString('ascii', 0, 6) === 'GIF87a' || buf.toString('ascii', 0, 6) === 'GIF89a'
        case 'image/webp':
          return buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP'
        default:
          return false
      }
    }
    if (!matchesImageSignature(buffer, file.type)) {
      return NextResponse.json({ error: 'This file does not look like a valid image. Please upload a real JPG, PNG, WEBP or GIF.' }, { status: 400 })
    }

    const fileName = `avatar-${business_id}.${ext}`
    await supabase.storage.createBucket('avatars', { public: true }).catch(() => { })
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, { contentType: file.type, upsert: true })
    if (uploadError) {
      console.error('Avatar upload error:', uploadError.message)
      return NextResponse.json({ error: 'Something went wrong uploading your avatar. Please try again.' }, { status: 500 })
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)

    // avatar_url lives on business_settings, NOT businesses — was silently failing before
    const { error: dbError } = await supabase.from('business_settings')
      .upsert({ business_id, avatar_url: publicUrl })
    if (dbError) {
      console.error('Avatar db save error:', dbError.message)
      return NextResponse.json({ error: 'Something went wrong saving your avatar. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ avatar_url: publicUrl })
  } catch (e) {
    console.error('Avatar upload error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}