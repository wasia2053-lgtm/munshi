import { AdminWhatsAppRequests } from "@/components/admin-whatsapp-requests"
import { createAdminClient } from "@/lib/supabase-server"

// This page only ever renders after middleware's Basic Auth check has already
// passed for this exact request — no separate client-side auth check needed.
export default async function AdminRequestsPage() {
    const supabase = createAdminClient()

    const { data: connectRequests } = await supabase
        .from('whatsapp_connection_requests')
        .select('*')
        .order('created_at', { ascending: false })

    const { data: credentialSubmissions } = await supabase
        .from('whatsapp_credentials_submissions')
        .select('*')
        .order('created_at', { ascending: false })

    const businessIds = [
        ...(connectRequests || []).map((r: any) => r.business_id),
        ...(credentialSubmissions || []).map((r: any) => r.business_id),
    ]
    const uniqueIds = [...new Set(businessIds)]

    let orgNames: Record<string, string> = {}
    if (uniqueIds.length > 0) {
        const { data: settings } = await supabase
            .from('business_settings')
            .select('business_id, organization_name')
            .in('business_id', uniqueIds)
        for (const s of settings || []) {
            orgNames[s.business_id] = s.organization_name
        }
    }

    const enrichedConnectRequests = (connectRequests || []).map((r: any) => ({
        ...r,
        organization_name: orgNames[r.business_id] || 'Unknown',
    }))
    const enrichedCredsSubmissions = (credentialSubmissions || []).map((r: any) => ({
        ...r,
        organization_name: orgNames[r.business_id] || 'Unknown',
    }))

    return (
        <AdminWhatsAppRequests
            connectRequests={enrichedConnectRequests}
            credsSubmissions={enrichedCredsSubmissions}
        />
    )
}