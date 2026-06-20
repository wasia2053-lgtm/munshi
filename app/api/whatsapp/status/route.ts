import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const business_id = user.id;

  const { data: business } = await supabase
    .from('businesses')
    .select('whatsapp_status')
    .eq('id', business_id)
    .single();

  const { data: pendingRequest } = await supabase
    .from('whatsapp_connection_requests')
    .select('id, phone_number, status, created_at')
    .eq('business_id', business_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({
    whatsappStatus: business?.whatsapp_status || 'disconnected',
    pendingRequest: pendingRequest || null,
  });
}