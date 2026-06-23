"use client"

import { useState, useEffect } from "react"
import { CheckIcon, ClockIcon, ZapIcon, StarIcon, RocketIcon, SparklesIcon, ArrowRightIcon } from "lucide-react"
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
        icon: ZapIcon,
        desc: "Try Munshi free. No card required.",
        features: [
            "50 AI replies/month",
            "1 WhatsApp number",
            "Basic AI bot",
            "Roman Urdu + English",
            "5-page website training",
            "Conversation history",
        ],
    },
    {
        key: "basic",
        name: "Basic",
        priceUSD: 4,
        pricePKR: 1000,
        messages: 1000,
        icon: StarIcon,
        desc: "Perfect first step for small businesses.",
        features: [
            "1,000 AI replies/month",
            "1 WhatsApp number",
            "PDF + text training",
            "All 4 languages",
            "Operating hours & away msg",
            "Website training (10 pages)",
        ],
    },
    {
        key: "growth",
        name: "Growth",
        priceUSD: 25,
        pricePKR: 7000,
        messages: 5000,
        icon: RocketIcon,
        popular: true,
        desc: "For growing businesses ready to scale.",
        features: [
            "5,000 AI replies/month",
            "1 WhatsApp number",
            "Analytics dashboard",
            "Conversation memory",
            "Custom bot personality",
            "All training types",
        ],
    },
    {
        key: "pro",
        name: "Pro",
        priceUSD: 99,
        pricePKR: 30000,
        messages: 50000,
        icon: SparklesIcon,
        desc: "For teams and high-volume businesses.",
        features: [
            "50,000 AI replies/month",
            "3 WhatsApp numbers",
            "Human handoff inbox",
            "Priority support",
            "Instagram DMs (soon)",
            "Full API access",
        ],
    },
    {
        key: "enterprise",
        name: "Enterprise",
        priceUSD: null,
        pricePKR: null,
        messages: null,
        icon: SparklesIcon,
        desc: "Custom limits, dedicated support, white-label.",
        features: [
            "Unlimited messages",
            "Dedicated support",
            "Custom integrations",
            "White-label option",
            "SLA guarantee",
            "Onboarding assistance",
        ],
    },
]

export function BillingView() {
    const [data, setData] = useState<BillingData | null>(null)
    const [loading, setLoading] = useState(true)
    const [currency, setCurrency] = useState<Currency>("PKR")

    useEffect(() => {
        fetch('/api/billing', { credentials: 'include' })
            .then(res => res.json())
            .then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const usagePercent = data ? Math.min(100, Math.round((data.messagesUsed / data.messagesLimit) * 100)) : 0
    const currentPlan = plans.find(p => p.key === data?.plan) || plans[0]

    const handleUpgrade = (planName: string) => {
        const message = encodeURIComponent(`Hi, I want to upgrade my Munshi plan to ${planName}`);
        window.open(`https://wa.me/923282847607?text=${message}`, '_blank');
    };

    const formatPrice = (plan: typeof plans[0]) => {
        if (plan.priceUSD === null) return "Custom"
        if (plan.priceUSD === 0) return "Free"
        return currency === "PKR"
            ? `PKR ${plan.pricePKR!.toLocaleString()}`
            : `$${plan.priceUSD}`
    }

    return (
        <div className="space-y-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Billing & Subscription</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage your plan and usage</p>
                </div>
                <div className="flex p-1 bg-muted rounded-xl gap-1">
                    {(["PKR", "USD"] as Currency[]).map(c => (
                        <button
                            key={c}
                            onClick={() => setCurrency(c)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                                currency === c
                                    ? "bg-[var(--chart-1)] text-background shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Current plan + usage */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3 rounded-2xl border border-[var(--chart-1)]/25 bg-[var(--chart-1)]/5 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--chart-1)]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--chart-1)]/15 text-[var(--chart-1)] text-[11px] font-bold uppercase tracking-wide mb-4">
                        <span className="size-1.5 rounded-full bg-[var(--chart-1)] animate-pulse" />
                        Active Plan
                    </span>
                    {loading ? (
                        <div className="h-10 w-40 bg-muted/50 rounded animate-pulse mb-2" />
                    ) : (
                        <>
                            <h3 className="text-3xl font-bold mb-1">{currentPlan.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                {data?.validUntil
                                    ? `Renews ${new Date(data.validUntil).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                    : "No active subscription — upgrade to unlock more messages"}
                            </p>
                        </>
                    )}
                </div>

                <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Monthly Usage</p>
                    {loading ? (
                        <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                    ) : (
                        <>
                            <div className="flex items-end justify-between">
                                <p className="text-4xl font-bold tabular-nums">{data?.messagesUsed.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground pb-1">/ {data?.messagesLimit.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1.5">
                                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-700 ease-out",
                                            usagePercent >= 90 ? "bg-destructive" : "bg-[var(--chart-1)]"
                                        )}
                                        style={{ width: `${usagePercent}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">{usagePercent}% used this month</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Coming soon */}
            <div className="flex items-center gap-4 p-5 bg-[var(--chart-1)]/5 border border-[var(--chart-1)]/15 rounded-2xl">
                <div className="size-10 rounded-xl bg-[var(--chart-1)]/10 text-[var(--chart-1)] flex items-center justify-center shrink-0">
                    <ClockIcon className="size-5" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold">Online payments coming soon</p>
                    <p className="text-sm text-muted-foreground">Safepay (Pakistan) and DodoPayments (international) are being finalized. Upgrades will be one click away.</p>
                </div>
            </div>

            {/* Plans */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    {plans.map((plan, idx) => {
                        const isCurrent = plan.key === data?.plan
                        const Icon = plan.icon
                        return (
                            <div
                                key={plan.key}
                                style={{ animationDelay: `${idx * 60}ms` }}
                                className={cn(
                                    "relative rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
                                    isCurrent
                                        ? "border-[var(--chart-1)]/50 bg-[var(--chart-1)]/5"
                                        : plan.popular
                                            ? "border-[var(--chart-1)]/25 bg-card"
                                            : "border-border bg-card hover:border-[var(--chart-1)]/20"
                                )}
                            >
                                {isCurrent && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--chart-1)] text-background text-[10px] font-black uppercase tracking-wide whitespace-nowrap">
                                        Current Plan
                                    </span>
                                )}
                                {plan.popular && !isCurrent && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-foreground text-background text-[10px] font-black uppercase tracking-wide whitespace-nowrap">
                                        Most Popular
                                    </span>
                                )}

                                <div>
                                    <div className={cn(
                                        "size-9 rounded-xl flex items-center justify-center mb-3",
                                        isCurrent ? "bg-[var(--chart-1)]/15 text-[var(--chart-1)]" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Icon className="size-4" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{plan.name}</p>
                                    <p className="text-2xl font-bold mt-0.5">
                                        {formatPrice(plan)}
                                        {plan.priceUSD !== null && plan.priceUSD > 0 && (
                                            <span className="text-sm font-normal text-muted-foreground">/mo</span>
                                        )}
                                    </p>
                                    {plan.messages && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{plan.messages.toLocaleString()} msgs/mo</p>
                                    )}
                                </div>

                                <ul className="space-y-1.5 flex-1">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                            <CheckIcon className="size-3 text-[var(--chart-1)] shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {(isCurrent || plan.key !== "free") && (
                                    <button
                                        disabled={isCurrent}
                                        onClick={!isCurrent ? () => handleUpgrade(plan.name) : undefined}
                                        className={cn(
                                            "w-full py-2.5 rounded-xl text-xs font-semibold transition-all",
                                            isCurrent
                                                ? "bg-[var(--chart-1)]/15 text-[var(--chart-1)] cursor-default"
                                                : "bg-[var(--chart-1)] text-primary-foreground hover:bg-[var(--chart-1)]/90 shadow-sm"
                                        )}
                                    >
                                        {isCurrent ? "Current Plan" : "Contact us to Upgrade"}
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}