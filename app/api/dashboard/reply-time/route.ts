import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

function getRangeDays(range: string): number {
    if (range === 'all') return 1825;
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
            .select('conversation_id, sender, timestamp')
            .in('conversation_id', convIds)
            .gte('timestamp', startDate.toISOString())
            .order('timestamp', { ascending: true });
        messages = msgData || [];
    }

    const byConv: Record<string, any[]> = {};
    for (const m of messages) {
        if (!byConv[m.conversation_id]) byConv[m.conversation_id] = [];
        byConv[m.conversation_id].push(m);
    }

    const byDay: Record<string, number[]> = {};
    const useShortFormat = days > 14;

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = useShortFormat
            ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : d.toLocaleDateString('en-US', { weekday: 'short' });
        byDay[label] = [];
    }

    for (const convId in byConv) {
        const msgs = byConv[convId];
        for (let i = 0; i < msgs.length - 1; i++) {
            if (msgs[i].sender === 'customer' && msgs[i + 1].sender === 'bot') {
                const gap = (new Date(msgs[i + 1].timestamp).getTime() - new Date(msgs[i].timestamp).getTime()) / 1000;
                if (gap >= 0 && gap < 300) {
                    const d = new Date(msgs[i].timestamp);
                    const label = useShortFormat
                        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : d.toLocaleDateString('en-US', { weekday: 'short' });
                    if (byDay[label]) byDay[label].push(gap / 60);
                }
            }
        }
    }

    const rows = Object.entries(byDay).map(([day, times]) => ({
        day,
        minutes: times.length > 0
            ? Number((times.reduce((a, b) => a + b, 0) / times.length).toFixed(1))
            : 0,
    }));

    return NextResponse.json({ rows });
}