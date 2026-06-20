import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

function getRangeDays(range: string): number {
    if (range === 'all') return 1825; // ~5 years cap for "all"
    return Number(range) || 30;
}

export async function GET(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('days') || '30';
    const days = getRangeDays(range);
    const business_id = user.id;

    const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('business_id', business_id);

    const convIds = (conversations || []).map((c: any) => c.id);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    let messages: any[] = [];
    if (convIds.length > 0) {
        const { data: msgData } = await supabase
            .from('messages')
            .select('sender, timestamp')
            .in('conversation_id', convIds)
            .gte('timestamp', startDate.toISOString());
        messages = msgData || [];
    }

    const byDay: Record<string, { bot: number; customer: number }> = {};
    const useShortFormat = days > 14;

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = useShortFormat
            ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : d.toLocaleDateString('en-US', { weekday: 'short' });
        byDay[label] = { bot: 0, customer: 0 };
    }

    for (const m of messages) {
        const d = new Date(m.timestamp);
        const label = useShortFormat
            ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : d.toLocaleDateString('en-US', { weekday: 'short' });
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