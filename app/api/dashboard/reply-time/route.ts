import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

function getStartDate(days: string): Date | null {
    if (days === 'all') return null;
    const n = Number(days) || 30;
    const d = new Date();
    d.setDate(d.getDate() - (n - 1));
    d.setHours(0, 0, 0, 0);
    return d;
}

function toDateKey(d: Date): string {
    return d.toISOString().split('T')[0];
}

function shortLabel(dateKey: string): string {
    // "2026-08-20" -> "Aug 20" — matches this chart's plain XAxis (no tickFormatter)
    const d = new Date(`${dateKey}T12:00:00`);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export async function GET(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '30';
    const business_id = user.id;

    const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('business_id', business_id);

    if (convError) {
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    const convIds = (conversations || []).map((c: any) => c.id);
    const startDate = getStartDate(days);

    let messages: { conversation_id: string; sender: string; timestamp: string }[] = [];
    if (convIds.length > 0) {
        let query = supabase
            .from('messages')
            .select('conversation_id, sender, timestamp')
            .in('conversation_id', convIds)
            .order('timestamp', { ascending: true });

        if (startDate) {
            query = query.gte('timestamp', startDate.toISOString());
        }

        const { data: msgData, error: msgError } = await query;
        if (msgError) {
            return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
        }
        messages = msgData || [];
    }

    // Group by conversation to find consecutive customer -> bot pairs,
    // same logic as /api/dashboard/stats — capped at 5 min per reply to
    // exclude away-message / next-day replies from skewing the average.
    const byConv: Record<string, typeof messages> = {};
    messages.forEach((m) => {
        if (!byConv[m.conversation_id]) byConv[m.conversation_id] = [];
        byConv[m.conversation_id].push(m);
    });

    const dailyGaps: Record<string, number[]> = {};
    for (const convId in byConv) {
        const msgs = byConv[convId];
        for (let i = 0; i < msgs.length - 1; i++) {
            if (msgs[i].sender === 'customer' && msgs[i + 1].sender === 'bot') {
                const gapSeconds =
                    (new Date(msgs[i + 1].timestamp).getTime() - new Date(msgs[i].timestamp).getTime()) / 1000;
                if (gapSeconds >= 0 && gapSeconds < 300) {
                    const dateKey = toDateKey(new Date(msgs[i].timestamp));
                    if (!dailyGaps[dateKey]) dailyGaps[dateKey] = [];
                    dailyGaps[dateKey].push(gapSeconds);
                }
            }
        }
    }

    const dailyAvgMinutes: Record<string, number> = {};
    Object.entries(dailyGaps).forEach(([date, gaps]) => {
        const avgSeconds = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        dailyAvgMinutes[date] = Math.round((avgSeconds / 60) * 10) / 10;
    });

    let rows: { day: string; minutes: number }[];

    if (startDate) {
        const n = Number(days) || 30;
        rows = [];
        for (let i = 0; i < n; i++) {
            const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const key = toDateKey(d);
            rows.push({ day: shortLabel(key), minutes: dailyAvgMinutes[key] || 0 });
        }
    } else {
        rows = Object.entries(dailyAvgMinutes)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, minutes]) => ({ day: shortLabel(date), minutes }));
    }

    return NextResponse.json({ rows });
}