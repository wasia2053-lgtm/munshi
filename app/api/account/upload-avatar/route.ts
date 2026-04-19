import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUSINESS_ID = 'dfaa4c16-a081-431a-93d2-ab9ff5637de9'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('avatar') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop()
  const fileName = `avatar-${BUSINESS_ID}.${ext}` 
  await supabase.storage.createBucket('avatars', { public: true }).catch(() => {})
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, buffer, { contentType: file.type, upsert: true })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
  await supabase.from('business_settings')
    .upsert({ business_id: BUSINESS_ID, avatar_url: publicUrl }, { onConflict: 'business_id' })
  return NextResponse.json({ url: publicUrl })
}
