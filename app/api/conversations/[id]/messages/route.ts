import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'No conversation ID' }, { status: 400 });
    }

    // Step 1: conversation_id se try karo
    const { data: byConvId, error: err1 } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (!err1 && byConvId && byConvId.length > 0) {
      return NextResponse.json(byConvId);
    }

    // Step 2: conversation table se customer_phone fetch karo
    const { data: conv, error: err2 } = await supabase
      .from('conversations')
      .select('customer_phone')
      .eq('id', id)
      .single();

    if (err2 || !conv) {
      console.error('Conversation not found:', err2);
      return NextResponse.json([]);
    }

    // Step 3: customer_phone se messages fetch karo
    const { data: byPhone, error: err3 } = await supabase
      .from('messages')
      .select('*')
      .eq('customer_phone', conv.customer_phone)
      .order('created_at', { ascending: true });

    if (err3) {
      console.error('Messages by phone error:', err3);
      return NextResponse.json({ error: err3.message }, { status: 500 });
    }

    return NextResponse.json(byPhone || []);

  } catch (err: any) {
    console.error('Messages API crash:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}