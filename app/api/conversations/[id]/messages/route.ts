import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const business_id = user.id;

  // Verify this conversation belongs to the logged-in business
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, customer_phone, customer_summary, is_resolved')
    .eq('id', id)
    .eq('business_id', business_id)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender, content, timestamp')
    .eq('conversation_id', id)
    .order('timestamp', { ascending: true });

  return NextResponse.json({
    conversation,
    messages: messages || []
  });
}