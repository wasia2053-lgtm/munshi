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
import { Badge } from "@/components/ui/badge"
import { CheckIcon, ClockIcon, GlobeIcon, MapPinIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type BillingData = {
    plan: string
    messagesUsed: number
    messagesLimit: number
    validUntil: string | null
}

type Currency = "PKR" | "USD"

const plans = [
    {
        key: "free",
        name: "Starter",
        priceUSD: 0,
        pricePKR: 0,
        messages: 50,
        features: ["1 WhatsApp number", "Basic AI bot", "Roman Urdu support", "5-page website training"],
    },
    {
        key: "growth",
        name: "Growth",
        priceUSD: 25,
        pricePKR: 7000,
        messages: 5000,
        popular: true,
        features: ["1 WhatsApp number", "PDF + text training", "Context memory", "Analytics dashboard", "Custom bot personality"],
    },
    {
        key: "pro",
        name: "Pro",
        priceUSD: 99,
        pricePKR: 30000,
        messages: 50000,
        features: ["3 WhatsApp numbers", "Instagram + Facebook", "Human handoff", "Priority support", "Full API access"],
    },
]

export function BillingView() {
    const [data, setData] = useState<BillingData | null>(null)
    const [loading, setLoading] = useState(true)
    const [currency, setCurrency] = useState<Currency>("PKR")

    useEffect(() => {
        fetch('/api/billing', { credentials: 'include' })
            .then(res => res.json())
            .then(d => {
                setData(d)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading || !data) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                <div className="h-40 bg-muted rounded-xl animate-pulse" />
            </div>
        )
    }

    const currentPlan = plans.find(p => p.key === data.plan) || plans[0]
    const usagePercent = Math.min(100, Math.round((data.messagesUsed / data.messagesLimit) * 100))

    const formatPrice = (plan: typeof plans[0]) => {
        if (plan.priceUSD === 0) return "Free"
        return currency === "PKR" ? `PKR ${plan.pricePKR.toLocaleString()}` : `$${plan.priceUSD}`
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-semibold">Billing & Subscription</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage your plan and usage</p>
                </div>
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                    <button
                        onClick={() => setCurrency("PKR")}
                        className={cn(
                            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                            currency === "PKR" ? "bg-background shadow-sm" : "text-muted-foreground"
                        )}
                    >
                        <MapPinIcon className="size-3.5" /> PKR
                    </button>
                    <button
                        onClick={() => setCurrency("USD")}
                        className={cn(
                            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                            currency === "USD" ? "bg-background shadow-sm" : "text-muted-foreground"
                        )}
                    >
                        <GlobeIcon className="size-3.5" /> USD
                    </button>
                </div>
            </div>

            {/* Current plan + usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-none dark:ring-0 border-[var(--chart-1)]/20">
                    <CardContent className="pt-6">
                        <Badge variant="outline" className="text-[var(--chart-1)] border-[var(--chart-1)]/30 mb-3">
                            Active Plan
                        </Badge>
                        <div className="flex items-end justify-between">
                            <div>
                                <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {data.validUntil
                                        ? `Renews on ${new Date(data.validUntil).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                        : "No active subscription"}
                                </p>
                            </div>
                            <p className="text-2xl font-bold">{formatPrice(currentPlan)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-none dark:ring-0">
                    <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Monthly Usage</p>
                        <div className="flex items-end justify-between mb-3">
                            <p className="text-2xl font-bold tabular-nums">{data.messagesUsed.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">/ {data.messagesLimit.toLocaleString()} messages</p>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    usagePercent >= 90 ? "bg-destructive" : "bg-[var(--chart-1)]"
                                )}
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{usagePercent}% of your monthly limit used</p>
                    </CardContent>
                </Card>
            </div>

            {/* Coming soon banner */}
            <div className="flex items-center gap-4 p-5 bg-[var(--chart-1)]/5 border border-[var(--chart-1)]/15 rounded-xl">
                <ClockIcon className="size-6 text-[var(--chart-1)] shrink-0" />
                <div>
                    <p className="text-sm font-semibold">Online payments are almost here</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Safepay (Pakistan) and DodoPayments (international) are being finalized. Plan upgrades will be one click away soon.
                    </p>
                </div>
            </div>

            {/* Plans grid */}
            <div>
                <h3 className="text-base font-semibold mb-4">Available Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map(plan => {
                        const isCurrent = plan.key === data.plan
                        return (
                            <Card
                                key={plan.key}
                                className={cn(
                                    "shadow-none dark:ring-0 relative",
                                    isCurrent && "border-[var(--chart-1)]/40",
                                    plan.popular && !isCurrent && "border-[var(--chart-1)]/20"
                                )}
                            >
                                {isCurrent && (
                                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[var(--chart-1)] text-background text-[10px] font-bold uppercase">
                                        Current Plan
                                    </span>
                                )}
                                <CardHeader>
                                    <CardDescription className="uppercase text-[10px] font-bold tracking-wide">{plan.name}</CardDescription>
                                    <CardTitle className="text-3xl">
                                        {formatPrice(plan)}
                                        {plan.priceUSD > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">{plan.messages.toLocaleString()} messages / month</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ul className="space-y-2">
                                        {plan.features.map((f, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs">
                                                <CheckIcon className="size-3.5 text-[var(--chart-1)] shrink-0 mt-0.5" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        disabled
                                        variant={isCurrent ? "secondary" : "outline"}
                                        className="w-full"
                                    >
                                        {isCurrent ? "Active Subscription" : "Coming Soon"}
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}