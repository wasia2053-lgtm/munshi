import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business_id = user.id;

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan, messages_used, messages_limit, valid_until')
        .eq('user_id', business_id)
        .single();

    return NextResponse.json({
        plan: subscription?.plan || 'free',
        messagesUsed: subscription?.messages_used || 0,
        messagesLimit: subscription?.messages_limit || 50,
        validUntil: subscription?.valid_until || null,
    });
}