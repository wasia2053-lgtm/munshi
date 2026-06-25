"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    CheckCircle2Icon,
    XCircleIcon,
    UsersIcon,
    KeyRoundIcon,
    ClockIcon,
    SendIcon,
    ExternalLinkIcon,
    Loader2Icon,
    GraduationCapIcon,
    MessageSquareIcon,
    SettingsIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type StatusData = {
    whatsappStatus: string
    phoneNumber: string | null
    displayName: string | null
    pendingRequest: {
        id: string
        phone_number: string
        status: string
        created_at: string
    } | null
}

const selfServeSteps = [
    {
        title: "Create a Meta Business Account",
        desc: "Go to business.facebook.com and create a free Business Manager account if you don't have one.",
    },
    {
        title: "Add WhatsApp to your Business Manager",
        desc: "In Business Settings, find WhatsApp Accounts and click Add. Follow Meta's setup wizard.",
    },
    {
        title: "Verify your business phone number",
        desc: "Add your business phone number and verify it with the SMS/call code Meta sends.",
    },
    {
        title: "Generate a permanent access token",
        desc: "Under System Users, create a token with whatsapp_business_messaging permission.",
    },
]

const quickActions = [
    { title: "Train your bot", desc: "Add website, PDF or text sources", href: "/dashboard/training", icon: GraduationCapIcon },
    { title: "View conversations", desc: "See live customer chats", href: "/dashboard/conversations", icon: MessageSquareIcon },
    { title: "Bot settings", desc: "Tone, language & away message", href: "/dashboard/settings", icon: SettingsIcon },
]

export function WhatsAppView() {
    const [data, setData] = useState<StatusData | null>(null)
    const [loading, setLoading] = useState(true)

    const [showRequestForm, setShowRequestForm] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState("")
    const [businessName, setBusinessName] = useState("")
    const [notes, setNotes] = useState("")
    const [submittingRequest, setSubmittingRequest] = useState(false)
    const [requestSubmitted, setRequestSubmitted] = useState(false)

    const [showCredsForm, setShowCredsForm] = useState(false)
    const [phoneNumberId, setPhoneNumberId] = useState("")
    const [accessToken, setAccessToken] = useState("")
    const [credsPhoneNumber, setCredsPhoneNumber] = useState("")
    const [submittingCreds, setSubmittingCreds] = useState(false)
    const [credsSubmitted, setCredsSubmitted] = useState(false)

    useEffect(() => {
        fetch('/api/whatsapp/status', { credentials: 'include' })
            .then(res => res.json())
            .then(d => {
                setData(d)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    async function handleRequestSubmit() {
        if (!phoneNumber.trim()) return
        setSubmittingRequest(true)
        try {
            const res = await fetch('/api/whatsapp/connect-request', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: phoneNumber, business_name: businessName, notes }),
            })
            if (res.ok) {
                setRequestSubmitted(true)
                setShowRequestForm(false)
            }
        } finally {
            setSubmittingRequest(false)
        }
    }

    async function handleCredsSubmit() {
        if (!phoneNumberId.trim() || !accessToken.trim()) return
        setSubmittingCreds(true)
        try {
            const res = await fetch('/api/whatsapp/submit-credentials', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number_id: phoneNumberId, access_token: accessToken, phone_number: credsPhoneNumber }),
            })
            if (res.ok) {
                setCredsSubmitted(true)
                setShowCredsForm(false)
            }
        } finally {
            setSubmittingCreds(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                <div className="h-40 bg-muted rounded-xl animate-pulse" />
            </div>
        )
    }

    const isConnected = data?.whatsappStatus === 'connected'

    return (
        <div className="space-y-6 w-full">
            <div>
                <h2 className="text-xl font-semibold">WhatsApp Connection</h2>
                <p className="text-sm text-muted-foreground mt-1">Link your WhatsApp Business number to go live</p>
            </div>

            <Card className="shadow-none dark:ring-0">
                <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "size-14 rounded-full flex items-center justify-center",
                            isConnected ? "bg-[var(--chart-1)]/15 text-[var(--chart-1)]" : "bg-muted text-muted-foreground"
                        )}>
                            {isConnected ? <CheckCircle2Icon className="size-7" /> : <XCircleIcon className="size-7" />}
                        </div>
                        <div>
                            <p className="font-semibold text-base">
                                {isConnected ? "WhatsApp Connected" : "Not Connected Yet"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {isConnected ? "Your bot is live and replying to messages" : "Connect your number to activate your bot"}
                            </p>
                        </div>
                    </div>
                    {isConnected && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--chart-1)]/10 text-[var(--chart-1)] text-sm font-medium">
                            <span className="size-1.5 rounded-full bg-[var(--chart-1)] animate-pulse" />
                            Live
                        </span>
                    )}
                </CardContent>
            </Card>

            {isConnected && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="shadow-none dark:ring-0">
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground mb-1.5">Connected Number</p>
                                <p className="text-xl font-semibold tabular-nums">
                                    {data?.phoneNumber || "Not available"}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-none dark:ring-0">
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground mb-1.5">Display Name</p>
                                <p className="text-xl font-semibold">
                                    {data?.displayName || "Munshi Bot"}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {quickActions.map((action) => {
                                const Icon = action.icon
                                return (
                                    <Link key={action.href} href={action.href}>
                                        <Card className="shadow-none dark:ring-0 hover:border-[var(--chart-1)]/40 hover:bg-[var(--chart-1)]/5 transition-colors cursor-pointer h-full">
                                            <CardContent className="pt-6">
                                                <div className="size-10 rounded-lg bg-[var(--chart-1)]/10 text-[var(--chart-1)] flex items-center justify-center mb-3">
                                                    <Icon className="size-5" />
                                                </div>
                                                <p className="font-medium text-sm">{action.title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}

            {!isConnected && (
                <>
                    <div className="flex items-center gap-4 p-5 bg-[var(--chart-1)]/5 border border-[var(--chart-1)]/15 rounded-xl">
                        <ClockIcon className="size-6 text-[var(--chart-1)] shrink-0" />
                        <div>
                            <p className="text-sm font-semibold">One-click connect is on its way</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                We are finalizing Meta's official onboarding so you can connect instantly. Until then, use one of the options below.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-none dark:ring-0 border-[var(--chart-1)]/20">
                            <CardHeader className="pb-4">
                                <div className="size-11 rounded-lg bg-[var(--chart-1)]/10 text-[var(--chart-1)] flex items-center justify-center mb-3">
                                    <UsersIcon className="size-5" />
                                </div>
                                <CardTitle className="text-lg">Let us connect it for you</CardTitle>
                                <CardDescription className="text-sm leading-relaxed mt-1.5">
                                    Share your WhatsApp Business number. Our team handles the entire Meta setup and activates your bot within 24 hours, zero technical work on your end.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {requestSubmitted || data?.pendingRequest ? (
                                    <div className="flex items-center gap-2.5 p-4 bg-[var(--chart-1)]/5 rounded-lg text-sm">
                                        <CheckCircle2Icon className="size-4 text-[var(--chart-1)] shrink-0" />
                                        <span>
                                            Request submitted for <strong>{data?.pendingRequest?.phone_number || phoneNumber}</strong>. We will be in touch soon.
                                        </span>
                                    </div>
                                ) : !showRequestForm ? (
                                    <Button onClick={() => setShowRequestForm(true)} className="w-full" size="lg">
                                        Request Connection
                                    </Button>
                                ) : (
                                    <div className="space-y-3">
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={e => setPhoneNumber(e.target.value)}
                                            placeholder="WhatsApp Business number"
                                            className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-sm outline-none focus:border-[var(--chart-1)]"
                                        />
                                        <input
                                            type="text"
                                            value={businessName}
                                            onChange={e => setBusinessName(e.target.value)}
                                            placeholder="Business name"
                                            className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-sm outline-none focus:border-[var(--chart-1)]"
                                        />
                                        <textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            placeholder="Anything else we should know (optional)"
                                            rows={2}
                                            className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-sm outline-none focus:border-[var(--chart-1)] resize-none"
                                        />
                                        <Button onClick={handleRequestSubmit} disabled={submittingRequest || !phoneNumber.trim()} className="w-full" size="lg">
                                            {submittingRequest ? <Loader2Icon className="size-4 animate-spin mr-2" /> : <SendIcon className="size-4 mr-2" />}
                                            Submit Request
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-none dark:ring-0">
                            <CardHeader className="pb-4">
                                <div className="size-11 rounded-lg bg-muted text-muted-foreground flex items-center justify-center mb-3">
                                    <KeyRoundIcon className="size-5" />
                                </div>
                                <CardTitle className="text-lg">Connect it yourself</CardTitle>
                                <CardDescription className="text-sm leading-relaxed mt-1.5">
                                    Comfortable with Meta's dashboard? Follow these steps, then send us your credentials to activate.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ol className="space-y-3.5">
                                    {selfServeSteps.map((step, i) => (
                                        <li key={i} className="flex gap-3">
                                            <span className="size-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                {i + 1}
                                            </span>
                                            <div>
                                                <p className="text-sm font-medium leading-snug">{step.title}</p>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>

                                <a
                                    href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-sm text-[var(--chart-1)] hover:underline"
                                >
                                    Meta's official guide <ExternalLinkIcon className="size-3.5" />
                                </a>

                                <div className="pt-2 border-t border-border">
                                    {credsSubmitted ? (
                                        <div className="flex items-center gap-2.5 p-4 bg-[var(--chart-1)]/5 rounded-lg text-sm mt-4">
                                            <CheckCircle2Icon className="size-4 text-[var(--chart-1)] shrink-0" />
                                            <span>Credentials submitted, we will review and activate your bot soon.</span>
                                        </div>
                                    ) : !showCredsForm ? (
                                        <Button onClick={() => setShowCredsForm(true)} variant="outline" className="w-full mt-4" size="lg">
                                            I have my credentials
                                        </Button>
                                    ) : (
                                        <div className="space-y-3 mt-4">
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone Number ID</label>
                                                <input
                                                    type="text"
                                                    value={phoneNumberId}
                                                    onChange={e => setPhoneNumberId(e.target.value)}
                                                    placeholder="e.g. 1019865717885435"
                                                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-sm outline-none focus:border-[var(--chart-1)] font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Access Token</label>
                                                <input
                                                    type="password"
                                                    value={accessToken}
                                                    onChange={e => setAccessToken(e.target.value)}
                                                    placeholder="Paste your permanent access token"
                                                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-sm outline-none focus:border-[var(--chart-1)] font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">WhatsApp Number (optional)</label>
                                                <input
                                                    type="tel"
                                                    value={credsPhoneNumber}
                                                    onChange={e => setCredsPhoneNumber(e.target.value)}
                                                    placeholder="+92 300 1234567"
                                                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-sm outline-none focus:border-[var(--chart-1)]"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Your credentials are stored securely and only used to activate your bot.
                                            </p>
                                            <Button
                                                onClick={handleCredsSubmit}
                                                disabled={submittingCreds || !phoneNumberId.trim() || !accessToken.trim()}
                                                className="w-full"
                                                size="lg"
                                            >
                                                {submittingCreds ? <Loader2Icon className="size-4 animate-spin mr-2" /> : <SendIcon className="size-4 mr-2" />}
                                                Submit Credentials
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}