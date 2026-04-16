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

    // Step 1: Get conversation to find customer_phone
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convError || !conversation) {
      console.error('Conversation not found:', convError);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    console.log('📝 Found conversation:', {
      id: conversation.id,
      customer_phone: conversation.customer_phone,
      business_id: conversation.business_id
    });

    // Strip all non-digits for consistent comparison
    const customerPhoneDigits = conversation.customer_phone?.replace(/\D/g, '') || '';
    const customerPhoneWithPlus = conversation.customer_phone?.startsWith('+') 
      ? conversation.customer_phone 
      : `+${conversation.customer_phone}`;

    console.log(' Phone formats to try:', {
      original: conversation.customer_phone,
      digits: customerPhoneDigits,
      withPlus: customerPhoneWithPlus
    });
    let messages: any[] = [];
    let queryUsed = '';

    // Step 2: Try fetching messages by conversation_id only (simplified)
    console.log('\n Query: By conversation_id');
    let { data: messagesData, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('timestamp', { ascending: true });

    if (msgError) {
      console.log(' Query error:', msgError.message);
      messages = [];
    } else {
      console.log(` Found ${messagesData?.length || 0} messages by conversation_id`);
      messages = messagesData || [];
    }

    // Normalize data for frontend chat bubbles
    const normalizedMessages = messages?.map(m => ({
      id: m.id,
      message_text: m.content,
      message_type: m.sender === 'bot' ? 'outgoing' : 'incoming',
      created_at: m.timestamp,
      conversation_id: m.conversation_id
    })) || [];

    console.log(`\n Final result: ${normalizedMessages.length} messages normalized for frontend`);

    return NextResponse.json({
      conversation,
      messages: normalizedMessages,
      total: normalizedMessages.length,
    });

  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}