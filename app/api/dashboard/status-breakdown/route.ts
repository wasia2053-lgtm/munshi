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
        .select('id, last_message_time')
        .eq('business_id', business_id);

    const all = conversations || [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let active = 0;
    let recent = 0;
    let inactive = 0;

    for (const c of all) {
        if (!c.last_message_time) {
            inactive++;
            continue;
        }
        const t = new Date(c.last_message_time);
        if (t >= oneDayAgo) active++;
        else if (t >= sevenDaysAgo) recent++;
        else inactive++;
    }

    const total = all.length || 1;

    return NextResponse.json({
        breakdown: [
            { key: 'active', label: 'Active (24h)', count: active, share: Math.round((active / total) * 100) },
            { key: 'recent', label: 'Recent (7d)', count: recent, share: Math.round((recent / total) * 100) },
            { key: 'inactive', label: 'Inactive', count: inactive, share: Math.round((inactive / total) * 100) },
        ],
        totalConversations: all.length
    });
}