'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Check, Zap, Crown, TrendingUp, Rocket, Building2, Loader2, ArrowRight, CreditCard, Sparkles, Calendar, Mail } from 'lucide-react'

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
    accent: '#6b7280',
    bg: 'rgba(107,114,128,0.05)',
    border: 'rgba(107,114,128,0.12)',
    glow: 'rgba(0,0,0,0)',
    features: ['50 messages/month', '1 WhatsApp number', 'Basic AI bot', 'Website training (5 pages)', 'Roman Urdu support'],
    isFree: true,
    popular: false,
    isEnterprise: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    price_pkr: 1000,
    price_usd: 4,
    messages: 1000,
    icon: Rocket,
    accent: '#4ae176',
    bg: 'rgba(74,225,118,0.04)',
    border: 'rgba(74,225,118,0.15)',
    glow: 'rgba(74,225,118,0.05)',
    features: ['1,000 messages/month', '1 WhatsApp number', 'AI bot with memory', 'Website training (10 pages)', 'Roman Urdu + Arabic', 'Email support'],
    isFree: false,
    popular: false,
    isEnterprise: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price_pkr: 7000,
    price_usd: 25,
    messages: 5000,
    icon: TrendingUp,
    accent: '#4ae176',
    bg: 'rgba(74,225,118,0.07)',
    border: 'rgba(74,225,118,0.30)',
    glow: 'rgba(74,225,118,0.10)',
    features: ['5,000 messages/month', '1 WhatsApp number', 'Advanced AI + context memory', 'PDF & website training', 'Analytics dashboard', 'Custom bot personality', 'Priority email support'],
    isFree: false,
    popular: true,
    isEnterprise: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price_pkr: 30000,
    price_usd: 99,
    messages: 50000,
    icon: Crown,
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.05)',
    border: 'rgba(245,158,11,0.20)',
    glow: 'rgba(245,158,11,0.07)',
    features: ['50,000 messages/month', '3 WhatsApp numbers', 'Instagram + Facebook DMs', 'Human handoff inbox', 'Advanced analytics', 'Shopify/WooCommerce', 'API access', '24/7 priority support'],
    isFree: false,
    popular: false,
    isEnterprise: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price_pkr: 0,
    price_usd: 0,
    messages: 0,
    icon: Building2,
    accent: '#a78bfa',
    bg: 'rgba(167,139,250,0.05)',
    border: 'rgba(167,139,250,0.18)',
    glow: 'rgba(167,139,250,0.06)',
    features: ['Unlimited messages', 'Multiple WA numbers', 'All Pro features', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'White-label option'],
    isFree: false,
    popular: false,
    isEnterprise: true,
  },
]

const PLAN_ORDER = ['starter', 'basic', 'growth', 'pro', 'enterprise']

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState(false)
  const [visible, setVisible] = useState(false)

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
    requestAnimationFrame(() => setTimeout(() => setVisible(true), 50))
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
      if (data.url) window.location.href = data.url
      else alert('Checkout failed. Please try again.')
    } catch {
      alert('Something went wrong.')
    } finally {
      setUpgrading(null)
    }
  }

  const currentPlan = subscription?.plan ?? 'starter'
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan)
  const usedPct = subscription ? Math.min(100, Math.round((subscription.messages_used / subscription.messages_limit) * 100)) : 0
  const isNearLimit = usedPct >= 80

  return (
    <AppShell>
      <style>{`
        .bill-wrap { padding: 40px 36px; width: 100%; box-sizing: border-box; }

        .fade-up {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .fade-up.in { opacity: 1; transform: translateY(0); }

        .plan-card {
          border-radius: 20px;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .plan-card:hover { transform: translateY(-3px); }

        .upgrade-btn {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; width: 100%; padding: 13px 20px;
          border-radius: 12px; font-size: 13px; font-weight: 600;
          letter-spacing: 0.02em; cursor: pointer; border: none;
          transition: opacity 0.2s, transform 0.15s;
        }
        .upgrade-btn:hover { opacity: 0.88; }
        .upgrade-btn:active { transform: scale(0.98); }
        .upgrade-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .history-row:hover { background: rgba(255,255,255,0.02); }

        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }

        @media (max-width: 1200px) { .plans-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 860px)  { .plans-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 560px)  {
          .plans-grid { grid-template-columns: 1fr !important; }
          .bill-wrap { padding: 24px 16px !important; }
          .usage-inner { flex-direction: column !important; gap: 20px !important; }
        }
      `}</style>

      <div className="bill-wrap">

        {/* Success */}
        {successMsg && (
          <div className={`fade-up ${visible ? 'in' : ''}`} style={{
            background: 'rgba(74,225,118,0.08)',
            border: '1px solid rgba(74,225,118,0.3)',
            borderRadius: '14px', padding: '14px 20px',
            marginBottom: '28px', color: '#4ae176',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px',
          }}>
            <Sparkles size={15} /> Payment confirmed! Your plan is now active.
          </div>
        )}

        {/* Header */}
        <div className={`fade-up ${visible ? 'in' : ''}`} style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
            Billing & Plans
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            Start free. Scale when you're ready.
          </p>
        </div>

        {/* Usage Card */}
        {!loading && subscription && (
          <div className={`fade-up ${visible ? 'in' : ''}`} style={{
            transitionDelay: '0.08s',
            background: '#1a1b1c',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '18px', padding: '24px 30px', marginBottom: '32px',
          }}>
            <div className="usage-inner" style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
              <div style={{ minWidth: '160px' }}>
                <p style={{ color: '#4b5563', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                  Current Plan
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
                    {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                  </span>
                  <span style={{
                    background: 'rgba(74,225,118,0.1)', color: '#4ae176',
                    fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                    borderRadius: '99px', border: '1px solid rgba(74,225,118,0.2)',
                    letterSpacing: '0.06em',
                  }}>ACTIVE</span>
                </div>
                {subscription.valid_until && (
                  <p style={{ color: '#4b5563', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={10} />
                    Renews {new Date(subscription.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                  <p style={{ color: '#4b5563', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                    Messages Used
                  </p>
                  <span style={{ color: isNearLimit ? '#ef4444' : '#fff', fontSize: '18px', fontWeight: 700 }}>
                    {subscription.messages_used.toLocaleString()}
                    <span style={{ color: '#4b5563', fontSize: '13px', fontWeight: 400 }}> / {subscription.messages_limit.toLocaleString()}</span>
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                  <div style={{
                    height: '6px', borderRadius: '99px', width: `${usedPct}%`,
                    background: isNearLimit ? 'linear-gradient(90deg,#ef4444,#f87171)' : 'linear-gradient(90deg,#4ae176,#22c55e)',
                    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)',
                      animation: 'shimmer 2.2s infinite',
                    }} />
                  </div>
                </div>
                <p style={{ color: isNearLimit ? '#ef4444' : '#4b5563', fontSize: '12px', marginTop: '6px' }}>
                  {isNearLimit ? '⚠️ Almost at limit — upgrade to keep serving customers' : `${usedPct}% used this billing cycle`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className={`plans-grid fade-up ${visible ? 'in' : ''}`} style={{
          transitionDelay: '0.14s',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '14px',
          marginBottom: '40px',
          alignItems: 'start',
        }}>
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const planIndex = PLAN_ORDER.indexOf(plan.id)
            const isDowngrade = planIndex < currentPlanIndex
            const Icon = plan.icon

            return (
              <div
                key={plan.id}
                className="plan-card"
                style={{
                  background: plan.bg,
                  border: `1px solid ${isCurrent ? plan.accent + '50' : plan.border}`,
                  boxShadow: plan.popular
                    ? `0 0 32px ${plan.glow}, 0 4px 16px rgba(0,0,0,0.2)`
                    : `0 2px 12px rgba(0,0,0,0.15)`,
                }}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: '-12px', left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg,#4ae176,#22c55e)',
                    color: '#000', fontSize: '9px', fontWeight: 800,
                    padding: '4px 14px', borderRadius: '99px', whiteSpace: 'nowrap',
                    letterSpacing: '0.08em', boxShadow: '0 4px 16px rgba(74,225,118,0.35)',
                  }}>
                    ✦ MOST POPULAR
                  </div>
                )}

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '10px',
                      background: plan.accent + '15', border: `1px solid ${plan.accent}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={16} color={plan.accent} />
                    </div>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>{plan.name}</span>
                  </div>
                  {isCurrent && (
                    <span style={{
                      background: plan.accent + '15', color: plan.accent,
                      fontSize: '9px', fontWeight: 800, padding: '2px 7px',
                      borderRadius: '99px', border: `1px solid ${plan.accent}25`,
                      letterSpacing: '0.07em', flexShrink: 0,
                    }}>NOW</span>
                  )}
                </div>

                {/* Price */}
                <div style={{ marginBottom: '20px' }}>
                  {plan.isFree ? (
                    <div>
                      <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>Free</span>
                      <span style={{ color: '#4b5563', fontSize: '13px', marginLeft: '5px' }}>forever</span>
                    </div>
                  ) : plan.isEnterprise ? (
                    <div>
                      <span style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Custom</span>
                      <p style={{ color: '#4b5563', fontSize: '12px', margin: '3px 0 0' }}>Tailored to your needs</p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                        <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: 500 }}>PKR</span>
                        <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>
                          {plan.price_pkr.toLocaleString()}
                        </span>
                        <span style={{ color: '#4b5563', fontSize: '13px' }}>/mo</span>
                      </div>
                      <p style={{ color: '#4b5563', fontSize: '12px', margin: '3px 0 0' }}>
                        ~${plan.price_usd}/mo · {plan.messages.toLocaleString()} msgs
                      </p>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '18px' }} />

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '9px' }}>
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: plan.accent + '15', border: `1px solid ${plan.accent}28`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: '1px',
                      }}>
                        <Check size={9} color={plan.accent} strokeWidth={3} />
                      </div>
                      <span style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.5 }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div style={{
                    background: plan.accent + '10', border: `1px solid ${plan.accent}20`,
                    borderRadius: '12px', padding: '12px', textAlign: 'center',
                    color: plan.accent, fontSize: '12px', fontWeight: 700,
                  }}>
                    ✓ Current Plan
                  </div>
                ) : plan.isFree || isDowngrade ? (
                  <div style={{ height: '42px' }} />
                ) : plan.isEnterprise ? (
                  <a
                    href="mailto:shahmeershaikh900@gmail.com?subject=Munshi Enterprise Plan"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                      width: '100%', padding: '12px 16px', borderRadius: '12px',
                      fontSize: '12px', fontWeight: 700, letterSpacing: '0.02em',
                      background: plan.accent + '15', color: plan.accent,
                      border: `1px solid ${plan.accent}28`,
                      textDecoration: 'none', transition: 'opacity 0.2s',
                      boxSizing: 'border-box',
                    }}
                  >
                    <Mail size={13} /> Contact Us
                  </a>
                ) : (
                  <button
                    className="upgrade-btn"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!upgrading}
                    style={{
                      background: plan.popular
                        ? 'linear-gradient(135deg,#4ae176,#22c55e)'
                        : plan.id === 'pro'
                          ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                          : plan.accent + '18',
                      color: (plan.popular || plan.id === 'pro') ? '#000' : plan.accent,
                      border: (plan.popular || plan.id === 'pro') ? 'none' : `1px solid ${plan.accent}28`,
                      boxShadow: plan.popular ? '0 4px 20px rgba(74,225,118,0.25)' : plan.id === 'pro' ? '0 4px 20px rgba(245,158,11,0.2)' : 'none',
                    }}
                  >
                    {upgrading === plan.id
                      ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      : <ArrowRight size={13} />
                    }
                    {upgrading === plan.id ? 'Redirecting...' : `Upgrade`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Payment History */}
        <div className={`fade-up ${visible ? 'in' : ''}`} style={{
          transitionDelay: '0.22s',
          background: '#1a1b1c',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '18px', overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <CreditCard size={16} color="#4ae176" />
            <h2 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: 0, letterSpacing: '-0.2px' }}>
              Payment History
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#4b5563', fontSize: '14px' }}>Loading...</div>
          ) : payments.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
              }}>
                <CreditCard size={20} color="#374151" />
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, margin: '0 0 4px' }}>No payments yet</p>
              <p style={{ color: '#374151', fontSize: '13px', margin: 0 }}>Your payment history will appear here after your first upgrade.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Date', 'Plan', 'Amount', 'Gateway', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '11px 24px', textAlign: 'left', color: '#4b5563',
                        fontWeight: 700, fontSize: '10px', letterSpacing: '0.09em',
                        textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={p.id} className="history-row" style={{ borderBottom: i < payments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '14px 24px', color: '#6b7280' }}>
                        {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 24px', color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>{p.plan}</td>
                      <td style={{ padding: '14px 24px', color: '#4ae176', fontWeight: 700 }}>PKR {p.amount.toLocaleString()}</td>
                      <td style={{ padding: '14px 24px', color: '#6b7280', textTransform: 'capitalize' }}>{p.gateway}</td>
                      <td style={{ padding: '14px 24px' }}>
                        <span style={{
                          background: p.status === 'completed' ? 'rgba(74,225,118,0.08)' : 'rgba(239,68,68,0.08)',
                          color: p.status === 'completed' ? '#4ae176' : '#ef4444',
                          padding: '3px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 700,
                          border: `1px solid ${p.status === 'completed' ? 'rgba(74,225,118,0.18)' : 'rgba(239,68,68,0.18)'}`,
                          letterSpacing: '0.05em', textTransform: 'uppercase',
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

      </div>
    </AppShell>
  )
}