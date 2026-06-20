import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const isAllTime = daysParam === 'all';
    const days = isAllTime ? 0 : (Number(daysParam) || 30);
    const business_id = user.id;

    const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('business_id', business_id);

    const convIds = (conversations || []).map((c: any) => c.id);

    let startDate: Date;
    if (isAllTime) {
        // Find earliest message date
        let earliest: any = null;
        if (convIds.length > 0) {
            const { data: earliestMsg } = await supabase
                .from('messages')
                .select('timestamp')
                .in('conversation_id', convIds)
                .order('timestamp', { ascending: true })
                .limit(1)
                .single();
            earliest = earliestMsg;
        }
        startDate = earliest ? new Date(earliest.timestamp) : new Date();
        startDate.setHours(0, 0, 0, 0);
    } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
    }

    let messages: any[] = [];
    if (convIds.length > 0) {
        const { data: msgData } = await supabase
            .from('messages')
            .select('id, conversation_id, timestamp')
            .in('conversation_id', convIds)
            .gte('timestamp', startDate.toISOString())
            .order('timestamp', { ascending: true });
        messages = msgData || [];
    }

    const byDay: Record<string, Set<string>> = {};
    for (const m of messages) {
        const day = new Date(m.timestamp).toISOString().split('T')[0];
        if (!byDay[day]) byDay[day] = new Set();
        byDay[day].add(m.conversation_id);
    }

    const totalDays = isAllTime
        ? Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
        : days;

    const rows: { date: string; conversations: number }[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        rows.push({
            date: dateStr,
            conversations: byDay[dateStr]?.size || 0
        });
    }

    return NextResponse.json({ rows });
}