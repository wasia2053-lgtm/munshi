import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

function getStartDate(days: string): Date | null {
    if (days === 'all') return null;
    const n = Number(days) || 30;
    const d = new Date();
    d.setDate(d.getDate() - (n - 1)); // include today as one of the N days
    d.setHours(0, 0, 0, 0);
    return d;
}

function toDateKey(d: Date): string {
    return d.toISOString().split('T')[0];
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

    const { data: conversations, error } = await supabase
        .from('conversations')
        .select('created_at')
        .eq('business_id', business_id);

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    const startDate = getStartDate(days);
    const rowsData = conversations || [];

    // Count new conversations per calendar day.
    const dailyCounts: Record<string, number> = {};
    rowsData.forEach((c: any) => {
        if (!c.created_at) return;
        const created = new Date(c.created_at);
        if (startDate && created < startDate) return;
        const key = toDateKey(created);
        dailyCounts[key] = (dailyCounts[key] || 0) + 1;
    });

    let rows: { date: string; conversations: number }[];

    if (startDate) {
        // Fill every day in the window (including zero-count days) so the
        // chart shows a continuous line rather than gaps.
        const n = Number(days) || 30;
        rows = [];
        for (let i = 0; i < n; i++) {
            const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const key = toDateKey(d);
            rows.push({ date: key, conversations: dailyCounts[key] || 0 });
        }
    } else {
        // "all time" — just list the days that actually have data.
        rows = Object.entries(dailyCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, conversations]) => ({ date, conversations }));
    }

    return NextResponse.json({ rows });
}