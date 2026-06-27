'use client'

import { useEffect, useState, useRef } from 'react'
import { AppShell } from '@/components/app-shell'
import { Check, Zap, Crown, TrendingUp, Rocket, Loader2, ArrowRight, CreditCard, Sparkles, Calendar } from 'lucide-react'

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
    bg: 'rgba(107,114,128,0.06)',
    border: 'rgba(107,114,128,0.15)',
    glow: 'rgba(107,114,128,0)',
    features: ['50 messages/month', '1 WhatsApp number', 'Basic AI bot', 'Website training (5 pages)', 'Roman Urdu support'],
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
    accent: '#4ae176',
    bg: 'rgba(74,225,118,0.05)',
    border: 'rgba(74,225,118,0.18)',
    glow: 'rgba(74,225,118,0.06)',
    features: ['1,000 messages/month', '1 WhatsApp number', 'AI bot with memory', 'Website training (10 pages)', 'Roman Urdu + Arabic', 'Email support'],
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
    accent: '#4ae176',
    bg: 'rgba(74,225,118,0.08)',
    border: 'rgba(74,225,118,0.35)',
    glow: 'rgba(74,225,118,0.12)',
    features: ['5,000 messages/month', '1 WhatsApp number', 'Advanced AI + context memory', 'PDF & website training', 'Analytics dashboard', 'Custom bot personality', 'Priority email support'],
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
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.22)',
    glow: 'rgba(245,158,11,0.08)',
    features: ['50,000 messages/month', '3 WhatsApp numbers', 'Instagram + Facebook DMs', 'Human handoff inbox', 'Advanced analytics', 'Shopify/WooCommerce', 'API access', '24/7 priority support'],
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
    // Trigger entrance animations
    requestAnimationFrame(() => setVisible(true))
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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&display=swap');

        .billing-wrap { padding: 48px 40px; width: 100%; box-sizing: border-box; }

        .fade-up {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .fade-up.in {
          opacity: 1;
          transform: translateY(0);
        }

        .plan-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 24px;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          box-shadow: 0 0 40px var(--card-glow), 0 4px 20px rgba(0,0,0,0.25);
          cursor: default;
        }
        .plan-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 60px var(--card-glow), 0 12px 40px rgba(0,0,0,0.35);
        }

        .upgrade-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px 20px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.03em;
          cursor: pointer;
          border: none;
          transition: transform 0.15s ease, opacity 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .upgrade-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.2s ease;
        }
        .upgrade-btn:hover::after { background: rgba(255,255,255,0.08); }
        .upgrade-btn:active { transform: scale(0.98); }
        .upgrade-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 11px;
          animation: none;
        }

        .history-row { transition: background 0.15s ease; }
        .history-row:hover { background: rgba(255,255,255,0.025); }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .popular-badge {
          animation: pulse-glow 2.5s ease-in-out infinite;
        }

        @media (max-width: 1024px) {
          .plans-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .billing-wrap { padding: 24px 16px !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .usage-card-inner { flex-direction: column !important; gap: 20px !important; }
        }
      `}</style>

      <div className="billing-wrap">

        {/* Success Banner */}
        {successMsg && (
          <div className={`fade-up ${visible ? 'in' : ''}`} style={{
            background: 'linear-gradient(135deg, rgba(74,225,118,0.12), rgba(34,197,94,0.06))',
            border: '1px solid rgba(74,225,118,0.35)',
            borderRadius: '16px',
            padding: '16px 24px',
            marginBottom: '32px',
            color: '#4ae176',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
          }}>
            <Sparkles size={16} />
            Payment confirmed! Your plan is now active.
          </div>
        )}

        {/* Header */}
        <div className={`fade-up ${visible ? 'in' : ''}`} style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 800,
            color: '#fff',
            margin: '0 0 8px',
            letterSpacing: '-1px',
            lineHeight: 1.1,
          }}>
            Billing & Plans
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>
            Start free. Scale when you're ready.
          </p>
        </div>

        {/* Usage Card */}
        {!loading && subscription && (
          <div className={`fade-up ${visible ? 'in' : ''}`} style={{
            transitionDelay: '0.1s',
            background: '#1a1b1c',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            padding: '28px 36px',
            marginBottom: '36px',
          }}>
            <div className="usage-card-inner" style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
              <div style={{ minWidth: '180px' }}>
                <p style={{ color: '#4b5563', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                  Current Plan
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                    {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                  </span>
                  <span style={{
                    background: 'rgba(74,225,118,0.12)',
                    color: '#4ae176',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '99px',
                    border: '1px solid rgba(74,225,118,0.25)',
                    letterSpacing: '0.06em',
                  }}>ACTIVE</span>
                </div>
                {subscription.valid_until && (
                  <p style={{ color: '#4b5563', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={11} />
                    Renews {new Date(subscription.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                  <p style={{ color: '#4b5563', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                    Messages Used
                  </p>
                  <span style={{ color: isNearLimit ? '#ef4444' : '#fff', fontSize: '22px', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                    {subscription.messages_used.toLocaleString()}
                    <span style={{ color: '#4b5563', fontSize: '14px', fontWeight: 400 }}> / {subscription.messages_limit.toLocaleString()}</span>
                  </span>
                </div>
                {/* Progress track */}
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '99px', height: '8px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    height: '8px',
                    borderRadius: '99px',
                    width: `${usedPct}%`,
                    background: isNearLimit
                      ? 'linear-gradient(90deg, #ef4444, #f87171)'
                      : 'linear-gradient(90deg, #4ae176, #22c55e)',
                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                      animation: 'shimmer 2s infinite',
                    }} />
                  </div>
                </div>
                <p style={{ color: isNearLimit ? '#ef4444' : '#4b5563', fontSize: '12px', marginTop: '8px' }}>
                  {isNearLimit ? '⚠️ Almost at limit — upgrade to continue serving customers' : `${usedPct}% used this billing cycle`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className={`plans-grid fade-up ${visible ? 'in' : ''}`} style={{
          transitionDelay: '0.18s',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '48px',
          alignItems: 'start',
        }}>
          {PLANS.map((plan, i) => {
            const isCurrent = currentPlan === plan.id
            const planIndex = PLAN_ORDER.indexOf(plan.id)
            const isDowngrade = planIndex < currentPlanIndex
            const Icon = plan.icon

            return (
              <div
                key={plan.id}
                className="plan-card"
                style={{
                  '--card-bg': plan.bg,
                  '--card-border': isCurrent ? plan.accent + '55' : plan.border,
                  '--card-glow': plan.glow,
                  animationDelay: `${i * 0.08}s`,
                } as any}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="popular-badge" style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, #4ae176, #22c55e)',
                    color: '#000',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '5px 18px',
                    borderRadius: '99px',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.08em',
                    boxShadow: '0 4px 20px rgba(74,225,118,0.4)',
                  }}>
                    ✦ MOST POPULAR
                  </div>
                )}

                {/* Plan name row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px', height: '38px',
                      borderRadius: '12px',
                      background: plan.accent + '18',
                      border: `1px solid ${plan.accent}28`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={17} color={plan.accent} />
                    </div>
                    <span style={{ fontFamily: "'Syne', sans-serif", color: '#fff', fontWeight: 700, fontSize: '17px' }}>{plan.name}</span>
                  </div>
                  {isCurrent && (
                    <span style={{
                      background: plan.accent + '18',
                      color: plan.accent,
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '99px',
                      border: `1px solid ${plan.accent}28`,
                      letterSpacing: '0.08em',
                      flexShrink: 0,
                    }}>NOW</span>
                  )}
                </div>

                {/* Price */}
                <div style={{ marginBottom: '24px' }}>
                  {plan.isFree ? (
                    <div>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '40px', fontWeight: 800, color: '#fff', letterSpacing: '-2px' }}>Free</span>
                      <span style={{ color: '#4b5563', fontSize: '14px', marginLeft: '6px' }}>forever</span>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                        <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>PKR</span>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '40px', fontWeight: 800, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>
                          {plan.price_pkr.toLocaleString()}
                        </span>
                        <span style={{ color: '#4b5563', fontSize: '14px' }}>/mo</span>
                      </div>
                      <p style={{ color: '#4b5563', fontSize: '12px', margin: '4px 0 0' }}>
                        ~${plan.price_usd}/mo · {plan.messages.toLocaleString()} msgs
                      </p>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '20px' }} />

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} className="feature-item">
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: plan.accent + '15',
                        border: `1px solid ${plan.accent}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: '1px',
                      }}>
                        <Check size={10} color={plan.accent} strokeWidth={3} />
                      </div>
                      <span style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5 }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div style={{
                    background: plan.accent + '10',
                    border: `1px solid ${plan.accent}22`,
                    borderRadius: '14px',
                    padding: '13px',
                    textAlign: 'center',
                    color: plan.accent,
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                  }}>
                    ✓ Current Plan
                  </div>
                ) : plan.isFree || isDowngrade ? (
                  <div style={{ height: '46px' }} />
                ) : (
                  <button
                    className="upgrade-btn"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!upgrading}
                    style={{
                      background: plan.popular
                        ? 'linear-gradient(135deg, #4ae176 0%, #22c55e 100%)'
                        : plan.id === 'pro'
                          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          : plan.accent + '20',
                      color: (plan.popular || plan.id === 'pro') ? '#000' : plan.accent,
                      border: (plan.popular || plan.id === 'pro') ? 'none' : `1px solid ${plan.accent}30`,
                      boxShadow: plan.popular
                        ? '0 4px 24px rgba(74,225,118,0.3)'
                        : plan.id === 'pro'
                          ? '0 4px 24px rgba(245,158,11,0.25)'
                          : 'none',
                    }}
                  >
                    {upgrading === plan.id
                      ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      : <ArrowRight size={14} />
                    }
                    {upgrading === plan.id ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Payment History */}
        <div className={`fade-up ${visible ? 'in' : ''}`} style={{
          transitionDelay: '0.26s',
          background: '#1a1b1c',
          border: '1px solid rgba(255,255,255,0.07)',
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
            <CreditCard size={17} color="#4ae176" />
            <h2 style={{ fontFamily: "'Syne', sans-serif", color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
              Payment History
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: '56px', textAlign: 'center', color: '#4b5563', fontSize: '14px' }}>Loading...</div>
          ) : payments.length === 0 ? (
            <div style={{ padding: '56px', textAlign: 'center' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <CreditCard size={22} color="#374151" />
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, margin: '0 0 4px' }}>No payments yet</p>
              <p style={{ color: '#374151', fontSize: '13px', margin: 0 }}>Your payment history will appear here after your first upgrade.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Date', 'Plan', 'Amount', 'Gateway', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '12px 28px', textAlign: 'left',
                      color: '#4b5563', fontWeight: 700, fontSize: '11px',
                      letterSpacing: '0.09em', textTransform: 'uppercase',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id} className="history-row" style={{ borderBottom: i < payments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '16px 28px', color: '#6b7280' }}>
                      {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '16px 28px', color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>{p.plan}</td>
                    <td style={{ padding: '16px 28px', color: '#4ae176', fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
                      PKR {p.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 28px', color: '#6b7280', textTransform: 'capitalize' }}>{p.gateway}</td>
                    <td style={{ padding: '16px 28px' }}>
                      <span style={{
                        background: p.status === 'completed' ? 'rgba(74,225,118,0.1)' : 'rgba(239,68,68,0.1)',
                        color: p.status === 'completed' ? '#4ae176' : '#ef4444',
                        padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
                        border: `1px solid ${p.status === 'completed' ? 'rgba(74,225,118,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </AppShell>
  )
}