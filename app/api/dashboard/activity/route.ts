import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business_id = user.id;

    const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('business_id', business_id)
        .order('created_at', { ascending: false })
        .limit(4);

    return NextResponse.json({
        items: notifications || []
    });
}