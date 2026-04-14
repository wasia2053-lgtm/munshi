// app/api/conversations/[id]/messages/route.ts
// FIXED: Next.js 14 async params + customer_phone fallback

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
    // ✅ Next.js 14 - params must be awaited
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Step 1: Get the conversation to find customer_phone
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convError || !conversation) {
      console.error('Conversation not found:', convError);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Step 2: Try fetching messages by conversation_id first
    let { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    // Step 3: Fallback — try by customer_phone if no results
    if ((!messages || messages.length === 0) && conversation.customer_phone) {
      const { data: fallbackMessages, error: fallbackError } = await supabase
        .from('messages')
        .select('*')
        .eq('customer_phone', conversation.customer_phone)
        .order('created_at', { ascending: true });

      if (!fallbackError && fallbackMessages) {
        messages = fallbackMessages;
      }
    }

    // Step 4: Also try by business_id + customer_phone combination
    if ((!messages || messages.length === 0) && conversation.business_id && conversation.customer_phone) {
      const { data: combo, error: comboError } = await supabase
        .from('messages')
        .select('*')
        .eq('business_id', conversation.business_id)
        .eq('customer_phone', conversation.customer_phone)
        .order('created_at', { ascending: true });

      if (!comboError && combo) {
        messages = combo;
      }
    }

    return NextResponse.json({
      conversation,
      messages: messages || [],
      total: messages?.length || 0,
    });

  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}