"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

type StatusData = {
    whatsappStatus: string
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
        desc: "In Business Settings, find \"WhatsApp Accounts\" and click \"Add\". Follow Meta's setup wizard.",
    },
    {
        title: "Verify your business phone number",
        desc: "Add your business phone number and verify it with the SMS/call code Meta sends.",
    },
    {
        title: "Generate a permanent access token",
        desc: "Under System Users, create a token with whatsapp_business_messaging permission.",
    },
    {
        title: "Send us your credentials",
        desc: "Once you have your Phone Number ID and Access Token, share them with our team via the form below — we'll plug them in and activate your bot.",
    },
]

export function WhatsAppView() {
    const [data, setData] = useState<StatusData | null>(null)
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState("")
    const [businessName, setBusinessName] = useState("")
    const [notes, setNotes] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        fetch('/api/whatsapp/status', { credentials: 'include' })
            .then(res => res.json())
            .then(d => {
                setData(d)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    async function handleSubmit() {
        if (!phoneNumber.trim()) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/whatsapp/connect-request', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: phoneNumber, business_name: businessName, notes }),
            })
            if (res.ok) {
                setSubmitted(true)
                setShowForm(false)
            }
        } finally {
            setSubmitting(false)
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
        <div className="space-y-6 max-w-3xl">
            <div>
                <h2 className="text-lg font-semibold">WhatsApp Connection</h2>
                <p className="text-sm text-muted-foreground">Link your WhatsApp Business number to go live</p>
            </div>

            {/* Status card */}
            <Card className="shadow-none dark:ring-0">
                <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "size-12 rounded-full flex items-center justify-center",
                            isConnected ? "bg-[var(--chart-1)]/15 text-[var(--chart-1)]" : "bg-muted text-muted-foreground"
                        )}>
                            {isConnected ? <CheckCircle2Icon className="size-6" /> : <XCircleIcon className="size-6" />}
                        </div>
                        <div>
                            <p className="font-semibold text-sm">
                                {isConnected ? "WhatsApp Connected" : "Not Connected Yet"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {isConnected ? "Your bot is live and replying to messages" : "Connect your number to activate your bot"}
                            </p>
                        </div>
                    </div>
                    {isConnected && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--chart-1)]/10 text-[var(--chart-1)] text-xs font-medium">
                            <span className="size-1.5 rounded-full bg-[var(--chart-1)] animate-pulse" />
                            Live
                        </span>
                    )}
                </CardContent>
            </Card>

            {!isConnected && (
                <>
                    {/* Coming soon banner */}
                    <div className="flex items-center gap-3 p-4 bg-[var(--chart-1)]/5 border border-[var(--chart-1)]/15 rounded-xl">
                        <ClockIcon className="size-5 text-[var(--chart-1)] shrink-0" />
                        <div>
                            <p className="text-sm font-medium">One-click connect is on its way</p>
                            <p className="text-xs text-muted-foreground">
                                We're finalizing Meta's official onboarding so you can connect instantly. Until then, two options below.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Option A: We do it for you */}
                        <Card className="shadow-none dark:ring-0 border-[var(--chart-1)]/20">
                            <CardHeader>
                                <div className="size-10 rounded-lg bg-[var(--chart-1)]/10 text-[var(--chart-1)] flex items-center justify-center mb-2">
                                    <UsersIcon className="size-5" />
                                </div>
                                <CardTitle className="text-base">Let us connect it for you</CardTitle>
                                <CardDescription>
                                    Tell us your WhatsApp Business number. Our team will reach out and complete the setup within 24 hours — no technical work needed on your end.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {submitted || data?.pendingRequest ? (
                                    <div className="flex items-center gap-2 p-3 bg-[var(--chart-1)]/5 rounded-lg text-sm">
                                        <CheckCircle2Icon className="size-4 text-[var(--chart-1)]" />
                                        <span>
                                            Request submitted for <strong>{data?.pendingRequest?.phone_number || phoneNumber}</strong>. We'll be in touch soon.
                                        </span>
                                    </div>
                                ) : !showForm ? (
                                    <Button onClick={() => setShowForm(true)} className="w-full">
                                        Request Connection
                                    </Button>
                                ) : (
                                    <div className="space-y-3">
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={e => setPhoneNumber(e.target.value)}
                                            placeholder="WhatsApp Business number"
                                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm outline-none focus:border-[var(--chart-1)]"
                                        />
                                        <input
                                            type="text"
                                            value={businessName}
                                            onChange={e => setBusinessName(e.target.value)}
                                            placeholder="Business name"
                                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm outline-none focus:border-[var(--chart-1)]"
                                        />
                                        <textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            placeholder="Anything else we should know? (optional)"
                                            rows={2}
                                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm outline-none focus:border-[var(--chart-1)] resize-none"
                                        />
                                        <Button onClick={handleSubmit} disabled={submitting || !phoneNumber.trim()} className="w-full">
                                            {submitting ? <Loader2Icon className="size-4 animate-spin mr-2" /> : <SendIcon className="size-4 mr-2" />}
                                            Submit Request
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Option B: Self-serve guide */}
                        <Card className="shadow-none dark:ring-0">
                            <CardHeader>
                                <div className="size-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center mb-2">
                                    <KeyRoundIcon className="size-5" />
                                </div>
                                <CardTitle className="text-base">Connect it yourself</CardTitle>
                                <CardDescription>
                                    If you're comfortable with Meta's dashboard, follow these steps to set it up on your own.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ol className="space-y-3">
                                    {selfServeSteps.map((step, i) => (
                                        <li key={i} className="flex gap-3">
                                            <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                                {i + 1}
                                            </span>
                                            <div>
                                                <p className="text-xs font-medium">{step.title}</p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">{step.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>

                                <a
                                    href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs text-[var(--chart-1)] mt-4 hover:underline"
                                >
                                    Meta's official guide <ExternalLinkIcon className="size-3" />
                                </a>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}