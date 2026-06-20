import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

const ADMIN_EMAIL = 'wasia2053@gmail.com';

export async function GET() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: connectRequests } = await supabase
        .from('whatsapp_connection_requests')
        .select('*, businesses:business_id(id)')
        .order('created_at', { ascending: false });

    const { data: credentialSubmissions } = await supabase
        .from('whatsapp_credentials_submissions')
        .select('*')
        .order('created_at', { ascending: false });

    // Get business names via business_settings for context
    const businessIds = [
        ...(connectRequests || []).map((r: any) => r.business_id),
        ...(credentialSubmissions || []).map((r: any) => r.business_id),
    ];
    const uniqueIds = [...new Set(businessIds)];

    let orgNames: Record<string, string> = {};
    if (uniqueIds.length > 0) {
        const { data: settings } = await supabase
            .from('business_settings')
            .select('business_id, organization_name')
            .in('business_id', uniqueIds);
        for (const s of settings || []) {
            orgNames[s.business_id] = s.organization_name;
        }
    }

    return NextResponse.json({
        connectRequests: (connectRequests || []).map((r: any) => ({
            ...r,
            organization_name: orgNames[r.business_id] || 'Unknown',
        })),
        credentialSubmissions: (credentialSubmissions || []).map((r: any) => ({
            ...r,
            organization_name: orgNames[r.business_id] || 'Unknown',
        })),
    });
}