import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const business_id = user.id;

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, customer_phone, last_message, last_message_time, customer_summary, is_resolved, created_at')
    .eq('business_id', business_id)
    .order('last_message_time', { ascending: false });

  return NextResponse.json({ conversations: conversations || [] });
}