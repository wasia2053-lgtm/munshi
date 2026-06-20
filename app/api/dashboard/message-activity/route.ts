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
        .select('id')
        .eq('business_id', business_id);

    const convIds = (conversations || []).map((c: any) => c.id);

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    tenDaysAgo.setHours(0, 0, 0, 0);

    let messages: any[] = [];
    if (convIds.length > 0) {
        const { data: msgData } = await supabase
            .from('messages')
            .select('sender, timestamp')
            .in('conversation_id', convIds)
            .gte('timestamp', tenDaysAgo.toISOString());
        messages = msgData || [];
    }

    const byDay: Record<string, { bot: number; customer: number }> = {};

    for (let i = 9; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        byDay[label] = { bot: 0, customer: 0 };
    }

    for (const m of messages) {
        const d = new Date(m.timestamp);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (byDay[label]) {
            if (m.sender === 'bot') byDay[label].bot++;
            else byDay[label].customer++;
        }
    }

    const rows = Object.entries(byDay).map(([day, counts]) => ({
        day,
        bot: counts.bot,
        customer: counts.customer,
    }));

    return NextResponse.json({ rows });
}