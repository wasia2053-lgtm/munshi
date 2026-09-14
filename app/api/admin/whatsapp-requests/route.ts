import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server'

function isAuthorized(req: Request): boolean {
    const authHeader = req.headers.get('authorization')
    const validUser = process.env.ADMIN_USERNAME
    const validPass = process.env.ADMIN_PASSWORD
    if (!validUser || !validPass || !authHeader?.startsWith('Basic ')) return false

    const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString()
    const [user, pass] = decoded.split(':')
    return user === validUser && pass === validPass
}

export async function GET(request: Request) {
    const supabase = createAdminClient();

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { data: notLockedOut } = await supabase.rpc('check_admin_lockout', { p_ip: ip })
    if (notLockedOut === false) {
        return NextResponse.json({ error: 'Too many failed attempts. Please try again later.' }, { status: 429 })
    }

    if (!isAuthorized(request)) {
        await supabase.rpc('record_admin_login_failure', { p_ip: ip })
        return NextResponse.json({ error: 'Forbidden' }, {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Munshi Admin"' },
        });
    }

    // Service-role client — was using the session-scoped client before, which meant
    // RLS silently limited results to the admin's OWN business_id only (i.e. basically empty).

    const { data: connectRequests } = await supabase
        .from('whatsapp_connection_requests')
        .select('*')
        .order('created_at', { ascending: false });

    const { data: credentialSubmissions } = await supabase
        .from('whatsapp_credentials_submissions')
        .select('*')
        .order('created_at', { ascending: false });

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