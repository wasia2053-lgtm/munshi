'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Check, Zap, Crown, Rocket, Loader2, ArrowRight, CreditCard, Calendar, TrendingUp, Sparkles } from 'lucide-react'

interface Subscription {
  plan: string
  messages_used: number
  messages_limit: number
  valid_until: string | null
}

interface Payment {
  id: string
  plan: string
  amount: number
  status: string
  gateway: string
  created_at: string
  reference_number: string
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price_pkr: 0,
    price_usd: 0,
    messages: 50,
    icon: Zap,
    gradient: 'linear-gradient(135deg, #1a1b1c 0%, #222326 100%)',
    accentColor: '#6b7280',
    borderColor: 'rgba(255,255,255,0.08)',
    features: [
      '50 messages/month',
      '1 WhatsApp number',
      'Basic AI bot',
      'Website training (5 pages)',
      'Roman Urdu support',
    ],
    isFree: true,
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    price_pkr: 1000,
    price_usd: 4,
    messages: 1000,
    icon: Rocket,
    gradient: 'linear-gradient(135deg, #0d1f14 0%, #122018 100%)',
    accentColor: '#4ae176',
    borderColor: 'rgba(74,225,118,0.2)',
    features: [
      '1,000 messages/month',
      '1 WhatsApp number',
      'AI bot with memory',
      'Website training (10 pages)',
      'Roman Urdu + Arabic',
      'Email support',
    ],
    isFree: false,
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price_pkr: 7000,
    price_usd: 25,
    messages: 5000,
    icon: TrendingUp,
    gradient: 'linear-gradient(135deg, #0a1f12 0%, #0d2618 100%)',
    accentColor: '#4ae176',
    borderColor: 'rgba(74,225,118,0.35)',
    features: [
      '5,000 messages/month',
      '1 WhatsApp number',
      'Advanced AI + context memory',
      'PDF & website training',
      'Analytics dashboard',
      'Custom bot personality',
      'Priority email support',
    ],
    isFree: false,
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price_pkr: 30000,
    price_usd: 99,
    messages: 50000,
    icon: Crown,
    gradient: 'linear-gradient(135deg, #1a1200 0%, #221800 100%)',
    accentColor: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.25)',
    features: [
      '50,000 messages/month',
      '3 WhatsApp numbers',
      'Instagram + Facebook DMs',
      'Human handoff inbox',
      'Advanced analytics',
      'Shopify/WooCommerce',
      'API access',
      '24/7 priority support',
    ],
    isFree: false,
    popular: false,
  },
]

const PLAN_ORDER = ['starter', 'basic', 'growth', 'pro']

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('success') === '1') {
        setSuccessMsg(true)
        window.history.replaceState({}, '', '/dashboard/billing')
        setTimeout(() => setSuccessMsg(false), 6000)
      }
    }
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [subRes, payRes] = await Promise.all([
        fetch('/api/subscription', { credentials: 'include' }),
        fetch('/api/payments', { credentials: 'include' }),
      ])
      if (subRes.ok) setSubscription(await subRes.json())
      if (payRes.ok) setPayments(await payRes.json())
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade(planId: string) {
    setUpgrading(planId)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Checkout failed. Please try again.')
      }
    } catch {
      alert('Something went wrong.')
    } finally {
      setUpgrading(null)
    }
  }

  const currentPlan = subscription?.plan ?? 'starter'
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan)
  const usedPct = subscription
    ? Math.min(100, Math.round((subscription.messages_used / subscription.messages_limit) * 100))
    : 0
  const isNearLimit = usedPct >= 80

  return (
    <AppShell>
      <div style={{ padding: '40px 32px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Success Banner */}
        {successMsg && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(74,225,118,0.15), rgba(74,225,118,0.05))',
            border: '1px solid rgba(74,225,118,0.4)',
            borderRadius: '14px',
            padding: '16px 24px',
            marginBottom: '32px',
            color: '#4ae176',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <Sparkles size={18} />
            Payment successful! Your plan has been activated. It may take a moment to reflect.
          </div>
        )}

        {/* Page Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            Billing & Plans
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>
            Manage your subscription and upgrade when you're ready to grow.
          </p>
        </div>

        {/* Usage Card */}
        {!loading && subscription && (
          <div style={{
            background: 'linear-gradient(135deg, #1a1b1c 0%, #1f2023 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '28px 32px',
            marginBottom: '40px',
            display: 'flex',
            gap: '40px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                Current Plan
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '26px', fontWeight: 700, color: '#fff' }}>
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </span>
                <span style={{
                  background: 'rgba(74,225,118,0.12)',
                  color: '#4ae176',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '99px',
                  border: '1px solid rgba(74,225,118,0.2)',
                }}>
                  Active
                </span>
              </div>
              {subscription.valid_until && (
                <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={12} />
                  Renews {new Date(subscription.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>

            <div style={{ flex: 2, minWidth: '260px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <p style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                  Messages Used
                </p>
                <span style={{ color: isNearLimit ? '#ef4444' : '#9ca3af', fontSize: '13px', fontWeight: 600 }}>
                  {subscription.messages_used.toLocaleString()} / {subscription.messages_limit.toLocaleString()}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                <div style={{
                  height: '6px',
                  borderRadius: '99px',
                  width: `${usedPct}%`,
                  background: isNearLimit
                    ? 'linear-gradient(90deg, #ef4444, #f87171)'
                    : 'linear-gradient(90deg, #4ae176, #22c55e)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <p style={{ color: isNearLimit ? '#ef4444' : '#6b7280', fontSize: '12px', marginTop: '8px' }}>
                {isNearLimit ? '⚠️ Almost at limit — consider upgrading' : `${usedPct}% used this billing cycle`}
              </p>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '48px',
        }}>
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const planIndex = PLAN_ORDER.indexOf(plan.id)
            const isDowngrade = planIndex < currentPlanIndex
            const Icon = plan.icon

            return (
              <div key={plan.id} style={{
                background: plan.gradient,
                border: `1px solid ${isCurrent ? plan.accentColor + '60' : plan.borderColor}`,
                borderRadius: '20px',
                padding: '28px 24px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: plan.popular
                  ? `0 0 40px rgba(74,225,118,0.08), 0 4px 24px rgba(0,0,0,0.3)`
                  : '0 4px 16px rgba(0,0,0,0.2)',
              }}>

                {/* Popular Badge */}
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-13px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, #4ae176, #22c55e)',
                    color: '#000',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 16px',
                    borderRadius: '99px',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.05em',
                  }}>
                    ✦ MOST POPULAR
                  </div>
                )}

                {/* Plan Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: `${plan.accentColor}18`,
                      border: `1px solid ${plan.accentColor}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Icon size={17} color={plan.accentColor} />
                    </div>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '16px' }}>{plan.name}</span>
                  </div>
                  {isCurrent && (
                    <span style={{
                      background: `${plan.accentColor}18`,
                      color: plan.accentColor,
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '99px',
                      border: `1px solid ${plan.accentColor}30`,
                      letterSpacing: '0.04em',
                    }}>
                      CURRENT
                    </span>
                  )}
                </div>

                {/* Price */}
                <div style={{ marginBottom: '24px' }}>
                  {plan.isFree ? (
                    <div>
                      <span style={{ fontSize: '36px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>Free</span>
                      <span style={{ color: '#6b7280', fontSize: '14px', marginLeft: '6px' }}>forever</span>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ color: '#6b7280', fontSize: '16px', fontWeight: 500 }}>PKR</span>
                        <span style={{ fontSize: '36px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>
                          {plan.price_pkr.toLocaleString()}
                        </span>
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>/mo</span>
                      </div>
                      <p style={{ color: '#6b7280', fontSize: '12px', margin: '3px 0 0' }}>
                        ~${plan.price_usd}/month · {plan.messages.toLocaleString()} messages
                      </p>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '20px' }} />

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: `${plan.accentColor}18`,
                        border: `1px solid ${plan.accentColor}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}>
                        <Check size={9} color={plan.accentColor} strokeWidth={3} />
                      </div>
                      <span style={{ color: '#c9d1d9', fontSize: '13px', lineHeight: '1.5' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {isCurrent ? (
                  <div style={{
                    background: `${plan.accentColor}10`,
                    border: `1px solid ${plan.accentColor}25`,
                    borderRadius: '12px',
                    padding: '12px',
                    textAlign: 'center',
                    color: plan.accentColor,
                    fontSize: '13px',
                    fontWeight: 600,
                  }}>
                    ✓ Your Current Plan
                  </div>
                ) : plan.isFree || isDowngrade ? null : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!upgrading}
                    style={{
                      background: plan.popular
                        ? 'linear-gradient(135deg, #4ae176, #22c55e)'
                        : plan.id === 'pro'
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : `${plan.accentColor}18`,
                      color: plan.popular || plan.id === 'pro' ? '#000' : plan.accentColor,
                      border: plan.popular || plan.id === 'pro' ? 'none' : `1px solid ${plan.accentColor}30`,
                      borderRadius: '12px',
                      padding: '13px 20px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: upgrading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      opacity: upgrading && upgrading !== plan.id ? 0.5 : 1,
                      transition: 'opacity 0.2s, transform 0.15s',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {upgrading === plan.id ? (
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <ArrowRight size={14} />
                    )}
                    {upgrading === plan.id ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Payment History */}
        <div style={{
          background: '#1a1b1c',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '24px 32px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <CreditCard size={18} color="#4ae176" />
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: 0 }}>Payment History</h2>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
              Loading...
            </div>
          ) : payments.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <CreditCard size={32} color="#374151" style={{ marginBottom: '12px' }} />
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No payments yet</p>
              <p style={{ color: '#4b5563', fontSize: '13px', marginTop: '4px' }}>Your payment history will appear here.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Date', 'Plan', 'Amount', 'Gateway', 'Status'].map((h) => (
                      <th key={h} style={{
                        padding: '12px 24px',
                        textAlign: 'left',
                        color: '#6b7280',
                        fontWeight: 500,
                        fontSize: '11px',
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={p.id} style={{
                      borderBottom: i < payments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      transition: 'background 0.15s',
                    }}>
                      <td style={{ padding: '16px 24px', color: '#9ca3af' }}>
                        {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '16px 24px', color: '#fff', fontWeight: 500, textTransform: 'capitalize' }}>{p.plan}</td>
                      <td style={{ padding: '16px 24px', color: '#4ae176', fontWeight: 700 }}>PKR {p.amount.toLocaleString()}</td>
                      <td style={{ padding: '16px 24px', color: '#9ca3af', textTransform: 'capitalize' }}>{p.gateway}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          background: p.status === 'completed' ? 'rgba(74,225,118,0.1)' : 'rgba(239,68,68,0.1)',
                          color: p.status === 'completed' ? '#4ae176' : '#ef4444',
                          padding: '4px 12px',
                          borderRadius: '99px',
                          fontSize: '12px',
                          fontWeight: 600,
                          border: `1px solid ${p.status === 'completed' ? 'rgba(74,225,118,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @media (max-width: 640px) {
            div[style*="padding: '40px 32px'"] { padding: 24px 16px !important; }
          }
        `}</style>
      </div>
    </AppShell>
  )
}