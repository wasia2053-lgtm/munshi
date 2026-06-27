'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Check, Zap, Crown, Rocket, Loader2, ExternalLink, CreditCard, Calendar, MessageSquare } from 'lucide-react'

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
    color: '#6b7280',
    features: [
      '50 messages/month',
      '1 WhatsApp number',
      'Basic AI bot',
      'Website training (5 pages)',
      'Roman Urdu support',
      'Conversation history',
    ],
    cta: 'Current Free Plan',
    isFree: true,
  },
  {
    id: 'basic',
    name: 'Basic',
    price_pkr: 1000,
    price_usd: 4,
    messages: 1000,
    icon: Rocket,
    color: '#4ae176',
    features: [
      '1,000 messages/month',
      '1 WhatsApp number',
      'AI bot with memory',
      'Website training (10 pages)',
      'Roman Urdu + Arabic support',
      'Email support',
    ],
    cta: 'Upgrade to Basic',
    isFree: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price_pkr: 7000,
    price_usd: 25,
    messages: 5000,
    icon: Rocket,
    color: '#4ae176',
    popular: true,
    features: [
      '5,000 messages/month',
      '1 WhatsApp number',
      'Advanced AI + context memory',
      'PDF & website training',
      'Analytics dashboard',
      'Custom bot personality',
      'Priority email support',
    ],
    cta: 'Upgrade to Growth',
    isFree: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price_pkr: 30000,
    price_usd: 99,
    messages: 50000,
    icon: Crown,
    color: '#f59e0b',
    features: [
      '50,000 messages/month',
      '3 WhatsApp numbers',
      'Instagram + Facebook DMs',
      'Human handoff inbox',
      'Advanced analytics',
      'Shopify/WooCommerce integration',
      'API access',
      '24/7 priority support',
    ],
    cta: 'Upgrade to Pro',
    isFree: false,
  },
]

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState(false)

  useEffect(() => {
    // Check for success redirect from LS
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('success') === '1') {
        setSuccessMsg(true)
        window.history.replaceState({}, '', '/dashboard/billing')
        setTimeout(() => setSuccessMsg(false), 5000)
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
  const usedPct = subscription
    ? Math.min(100, Math.round((subscription.messages_used / subscription.messages_limit) * 100))
    : 0

  return (
    <AppShell>
      <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Success Banner */}
        {successMsg && (
          <div style={{
            background: 'rgba(74,225,118,0.12)',
            border: '1px solid rgba(74,225,118,0.4)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            color: '#4ae176',
            fontWeight: 500,
          }}>
            ✅ Payment successful! Your plan has been activated. It may take a moment to reflect.
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>
            Billing & Plans
          </h1>
          <p style={{ color: '#9ca3af', marginTop: '6px', fontSize: '15px' }}>
            Manage your subscription and payment history
          </p>
        </div>

        {/* Current Usage Card */}
        {!loading && subscription && (
          <div style={{
            background: '#1a1b1c',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>CURRENT PLAN</p>
                <p style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '4px 0 0' }}>
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </p>
                {subscription.valid_until && (
                  <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>
                    <Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    Renews {new Date(subscription.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>MESSAGES USED</p>
                <p style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '4px 0 0' }}>
                  {subscription.messages_used.toLocaleString()} / {subscription.messages_limit.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '99px', height: '8px' }}>
                <div style={{
                  height: '8px',
                  borderRadius: '99px',
                  width: `${usedPct}%`,
                  background: usedPct > 80 ? '#ef4444' : '#4ae176',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '6px' }}>
                {usedPct}% used this billing cycle
              </p>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}>
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const Icon = plan.icon
            return (
              <div key={plan.id} style={{
                background: '#1a1b1c',
                border: plan.popular
                  ? '1.5px solid #4ae176'
                  : isCurrent
                    ? '1.5px solid rgba(74,225,118,0.4)'
                    : '1px solid rgba(255,255,255,0.10)',
                borderRadius: '16px',
                padding: '24px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#4ae176',
                    color: '#000',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 12px',
                    borderRadius: '99px',
                    whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Icon size={20} color={plan.color} />
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: '16px' }}>{plan.name}</span>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  {plan.isFree ? (
                    <p style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: 0 }}>Free</p>
                  ) : (
                    <>
                      <p style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: 0 }}>
                        PKR {plan.price_pkr.toLocaleString()}
                        <span style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 400 }}>/mo</span>
                      </p>
                      <p style={{ color: '#9ca3af', fontSize: '13px', margin: '2px 0 0' }}>
                        ~${plan.price_usd}/month
                      </p>
                    </>
                  )}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                      <Check size={14} color="#4ae176" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ color: '#d1d5db', fontSize: '13px' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div style={{
                    background: 'rgba(74,225,118,0.08)',
                    border: '1px solid rgba(74,225,118,0.3)',
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center',
                    color: '#4ae176',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}>
                    ✓ Current Plan
                  </div>
                ) : plan.isFree ? null : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading === plan.id}
                    style={{
                      background: plan.popular ? '#4ae176' : 'rgba(255,255,255,0.08)',
                      color: plan.popular ? '#000' : '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '11px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: upgrading === plan.id ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      transition: 'opacity 0.2s',
                      opacity: upgrading === plan.id ? 0.7 : 1,
                    }}
                  >
                    {upgrading === plan.id ? (
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <ExternalLink size={14} />
                    )}
                    {upgrading === plan.id ? 'Redirecting...' : plan.cta}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Payment History */}
        <div style={{
          background: '#1a1b1c',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <CreditCard size={18} color="#4ae176" />
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: 0 }}>Payment History</h2>
          </div>

          {loading ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: '24px' }}>Loading...</div>
          ) : payments.length === 0 ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: '24px', fontSize: '14px' }}>
              No payments yet
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Date', 'Plan', 'Amount', 'Gateway', 'Status'].map((h) => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 500, fontSize: '12px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px', color: '#d1d5db' }}>
                        {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px', color: '#fff', textTransform: 'capitalize' }}>{p.plan}</td>
                      <td style={{ padding: '12px', color: '#4ae176', fontWeight: 600 }}>PKR {p.amount.toLocaleString()}</td>
                      <td style={{ padding: '12px', color: '#9ca3af', textTransform: 'capitalize' }}>{p.gateway}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          background: p.status === 'completed' ? 'rgba(74,225,118,0.12)' : 'rgba(239,68,68,0.12)',
                          color: p.status === 'completed' ? '#4ae176' : '#ef4444',
                          padding: '3px 10px',
                          borderRadius: '99px',
                          fontSize: '12px',
                          fontWeight: 500,
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

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppShell>
  )
}