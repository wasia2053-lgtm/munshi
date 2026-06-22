import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const business_id = user.id;

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan, messages_used, messages_limit, valid_until')
        .eq('user_id', business_id)
        .single();

    // Real bot message count from messages table
    const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('business_id', business_id);

    const convIds = (conversations || []).map((c: any) => c.id);
    let realBotCount = 0;
    if (convIds.length > 0) {
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', convIds)
            .eq('sender', 'bot');
        realBotCount = count || 0;
    }

    return NextResponse.json({
        plan: subscription?.plan || 'free',
        messagesUsed: realBotCount,
        messagesLimit: subscription?.messages_limit || 50,
        validUntil: subscription?.valid_until || null,
    });
}