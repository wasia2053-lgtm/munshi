"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PhoneIcon, KeyIcon, ShieldAlertIcon } from "lucide-react"

type ConnectRequest = {
    id: string
    phone_number: string
    business_name: string | null
    notes: string | null
    status: string
    created_at: string
    organization_name: string
}

type CredsSubmission = {
    id: string
    phone_number_id: string
    access_token: string
    phone_number: string | null
    status: string
    created_at: string
    organization_name: string
}

export function AdminWhatsAppRequests() {
    const supabase = createClient()
    const [authorized, setAuthorized] = useState<boolean | null>(null)
    const [connectRequests, setConnectRequests] = useState<ConnectRequest[]>([])
    const [credsSubmissions, setCredsSubmissions] = useState<CredsSubmission[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setAuthorized(false)
                setLoading(false)
                return
            }
            const res = await fetch('/api/admin/whatsapp-requests', { credentials: 'include' })
            if (res.status === 403) {
                setAuthorized(false)
                setLoading(false)
                return
            }
            const data = await res.json()
            setConnectRequests(data.connectRequests || [])
            setCredsSubmissions(data.credentialSubmissions || [])
            setAuthorized(true)
            setLoading(false)
        }
        load()
    }, [])

    if (loading) {
        return <div className="p-8 text-sm text-muted-foreground">Loading...</div>
    }

    if (!authorized) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-3">
                <ShieldAlertIcon className="size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">You don't have access to this page</p>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-xl font-semibold">WhatsApp Connection Requests</h1>
                <p className="text-sm text-muted-foreground mt-1">Internal admin view — pending customer requests</p>
            </div>

            <div>
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <PhoneIcon className="size-4" /> Connection Requests ({connectRequests.length})
                </h2>
                <div className="space-y-3">
                    {connectRequests.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No requests yet</p>
                    ) : (
                        connectRequests.map(r => (
                            <Card key={r.id} className="shadow-none dark:ring-0">
                                <CardContent className="pt-4 flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-sm">{r.organization_name}</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">{r.phone_number}</p>
                                        {r.business_name && <p className="text-xs text-muted-foreground">Business: {r.business_name}</p>}
                                        {r.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{r.notes}"</p>}
                                        <p className="text-[11px] text-muted-foreground mt-2">{new Date(r.created_at).toLocaleString()}</p>
                                    </div>
                                    <Badge variant={r.status === 'pending' ? 'outline' : 'secondary'}>{r.status}</Badge>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <div>
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <KeyIcon className="size-4" /> Credential Submissions ({credsSubmissions.length})
                </h2>
                <div className="space-y-3">
                    {credsSubmissions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No submissions yet</p>
                    ) : (
                        credsSubmissions.map(r => (
                            <Card key={r.id} className="shadow-none dark:ring-0">
                                <CardContent className="pt-4 flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-sm">{r.organization_name}</p>
                                        <p className="text-xs text-muted-foreground mt-1 font-mono">Phone Number ID: {r.phone_number_id}</p>
                                        <p className="text-xs text-muted-foreground font-mono">Token: {r.access_token.slice(0, 12)}...{r.access_token.slice(-6)}</p>
                                        {r.phone_number && <p className="text-xs text-muted-foreground">Number: {r.phone_number}</p>}
                                        <p className="text-[11px] text-muted-foreground mt-2">{new Date(r.created_at).toLocaleString()}</p>
                                    </div>
                                    <Badge variant={r.status === 'pending' ? 'outline' : 'secondary'}>{r.status}</Badge>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}