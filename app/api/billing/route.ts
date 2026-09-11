import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const business_id = user.id;

        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('plan, messages_used, messages_limit, valid_until')
            .eq('user_id', business_id)
            .single();

        if (subError && subError.code !== 'PGRST116') {
            console.error('Error fetching subscription:', subError);
            return NextResponse.json({ error: 'Failed to fetch subscription data' }, { status: 500 });
        }

        // Real bot message count from messages table
        const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select('id')
            .eq('business_id', business_id);

        if (convError) {
            console.error('Error fetching conversations for billing:', convError);
            return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
        }

        const convIds = (conversations || []).map((c: any) => c.id);
        let realBotCount = 0;
        if (convIds.length > 0) {
            const { count, error: countError } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .in('conversation_id', convIds)
                .eq('sender', 'bot');

            if (countError) {
                console.error('Error counting messages for billing:', countError);
                return NextResponse.json({ error: 'Failed to count messages' }, { status: 500 });
            }

            realBotCount = count || 0;
        }

        return NextResponse.json({
            plan: subscription?.plan || 'free',
            messagesUsed: realBotCount,
            messagesLimit: subscription?.messages_limit || 50,
            validUntil: subscription?.valid_until || null,
        });
    } catch (error: any) {
        console.error('Billing GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}