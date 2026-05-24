'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import EmptyState from '@/components/EmptyState'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    priceLabel: 'Free',
    messages: 50,
    features: ['1 WhatsApp number', '50 msgs/month', 'Website training (5 pages)', 'Basic AI bot', 'Roman Urdu support'],
    cta: 'Current Plan',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 7000,
    priceLabel: 'PKR 7,000/mo',
    messages: 5000,
    popular: true,
    features: ['1 WhatsApp number', '5,000 msgs/month', 'Website training (15 pages)', 'PDF + Text training', 'Analytics dashboard', 'Context memory', 'Email support'],
    cta: 'Upgrade to Growth',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 30000,
    priceLabel: 'PKR 30,000/mo',
    messages: 50000,
    features: ['3 WhatsApp numbers', '50,000 msgs/month', 'Full website training (20 pages)', 'Instagram + Facebook DMs', 'Human handoff', 'Advanced analytics', 'Shopify integration', 'API access', '24/7 Priority support'],
    cta: 'Upgrade to Pro',
  },
]

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<any>(null)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [upgrading, setUpgrading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchCurrentPlan()
    fetchPaymentHistory()
  }, [])

  const fetchCurrentPlan = async () => {
    try {
      const res = await fetch('/api/billing/current', { credentials: 'include' })
      const data = await res.json()
      setCurrentPlan(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentHistory = async () => {
    try {
      const res = await fetch('/api/billing/history', { credentials: 'include' })
      const data = await res.json()
      setPaymentHistory(data.payments || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpgrade = (plan: any) => {
    setSelectedPlan(plan)
    setShowModal(true)
    setReferenceNumber('')
  }

  const submitUpgrade = async () => {
    if (!referenceNumber.trim()) {
      setToast({ message: 'Please enter a reference number', type: 'error' })
      return
    }

    setUpgrading(true)
    try {
      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plan: selectedPlan.id,
          reference_number: referenceNumber
        })
      })
      const data = await res.json()
      
      if (res.ok) {
        setToast({ message: 'Upgrade request submitted! We\'ll verify within 24 hours.', type: 'success' })
        setShowModal(false)
        fetchCurrentPlan()
        fetchPaymentHistory()
      } else {
        setToast({ message: data.error || 'Failed to submit upgrade request', type: 'error' })
      }
    } catch (e) {
      setToast({ message: 'Failed to submit upgrade request', type: 'error' })
    } finally {
      setUpgrading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { bg: '#D4A85333', color: '#D4A853' },
      active: { bg: '#2A9D8F33', color: '#2A9D8F' },
      failed: { bg: '#E05C5C33', color: '#E05C5C' }
    }
    const style = styles[status as keyof typeof styles] || styles.pending
    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: '500',
        textTransform: 'capitalize'
      }}>
        {status}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#F7E7CE', fontSize: '28px', fontWeight: '700', marginBottom: '24px', fontFamily: 'DM Sans, sans-serif' }}>
          Billing
        </h1>

        {loading ? (
          <div style={{ color: '#8A7560' }}>Loading...</div>
        ) : (
          <>
            {/* Section 1 - Current Plan Card */}
            <div style={{
              backgroundColor: '#0a1f1b',
              border: '1px solid #2A4A42',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ color: '#8A7560', fontSize: '14px', marginBottom: '8px', fontFamily: 'DM Sans, sans-serif' }}>Current Plan</div>
                  <div style={{
                    backgroundColor: '#D4A853',
                    color: '#102C26',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    fontFamily: 'DM Sans, sans-serif',
                    display: 'inline-block'
                  }}>
                    {currentPlan?.plan || 'Starter'}
                  </div>
                </div>
                {currentPlan?.valid_until && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#8A7560', fontSize: '14px', marginBottom: '4px', fontFamily: 'DM Sans, sans-serif' }}>Valid Until</div>
                    <div style={{ color: '#F7E7CE', fontSize: '16px', fontWeight: '500', fontFamily: 'DM Sans, sans-serif' }}>
                      {new Date(currentPlan.valid_until).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Messages Usage */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#F7E7CE', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                    Messages Used
                  </span>
                  <span style={{ color: '#D4A853', fontSize: '14px', fontWeight: '600', fontFamily: 'DM Sans, sans-serif' }}>
                    {currentPlan?.messages_used || 0} / {currentPlan?.messages_limit || 50}
                  </span>
                </div>
                <div style={{ backgroundColor: '#F7E7CE33', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                  <div style={{
                    backgroundColor: '#D4A853',
                    height: '100%',
                    width: `${((currentPlan?.messages_used || 0) / (currentPlan?.messages_limit || 500)) * 100}%`,
                    borderRadius: '999px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>

            {/* Section 2 - Plan Cards */}
            <h2 style={{ color: '#F7E7CE', fontSize: '20px', fontWeight: '600', marginBottom: '20px', fontFamily: 'DM Sans, sans-serif' }}>
              Upgrade Your Plan
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    backgroundColor: '#0a1f1b',
                    border: plan.popular ? '2px solid #D4A853' : '1px solid #2A4A42',
                    borderRadius: '12px',
                    padding: '24px',
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(212,168,83,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {plan.popular && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#D4A853',
                      color: '#102C26',
                      padding: '4px 16px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: '600',
                      fontFamily: 'DM Sans, sans-serif'
                    }}>
                      Most Popular
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ color: '#F7E7CE', fontSize: '24px', fontWeight: '700', marginBottom: '8px', fontFamily: 'DM Sans, sans-serif' }}>
                      {plan.name}
                    </div>
                    <div style={{ color: '#D4A853', fontSize: '32px', fontWeight: '700', fontFamily: 'DM Sans, sans-serif' }}>
                      {plan.priceLabel}
                    </div>
                    <div style={{ color: '#8A7560', fontSize: '13px', marginTop: '4px', fontFamily: 'DM Sans, sans-serif' }}>
                      {plan.messages.toLocaleString()} messages/month
                    </div>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '24px' }}>
                    {plan.features.map((feature, index) => (
                      <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <span style={{ color: '#D4A853', fontSize: '16px' }}>✓</span>
                        <span style={{ color: '#F7E7CE', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => (currentPlan?.plan === plan.id ? null : handleUpgrade(plan))}
                    disabled={currentPlan?.plan === plan.id}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: currentPlan?.plan === plan.id ? '1px solid #2A4A42' : 'none',
                      backgroundColor: currentPlan?.plan === plan.id ? 'transparent' : '#D4A853',
                      color: currentPlan?.plan === plan.id ? '#8A7560' : '#102C26',
                      fontSize: '14px',
                      fontWeight: '600',
                      fontFamily: 'DM Sans, sans-serif',
                      cursor: currentPlan?.plan === plan.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {currentPlan?.plan === plan.id ? 'Current Plan' : plan.cta}
                  </button>
                </div>
              ))}
            </div>

            {/* Section 4 - Payment History */}
            <h2 style={{ color: '#F7E7CE', fontSize: '20px', fontWeight: '600', marginBottom: '20px', fontFamily: 'DM Sans, sans-serif' }}>
              Payment History
            </h2>
            {paymentHistory.length === 0 ? (
              <EmptyState title="No payments yet" message="Your payment history will appear here" />
            ) : (
              <div style={{
                backgroundColor: '#0a1f1b',
                border: '1px solid #2A4A42',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #2A4A42' }}>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#8A7560', fontSize: '13px', fontWeight: '500', fontFamily: 'DM Sans, sans-serif' }}>Date</th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#8A7560', fontSize: '13px', fontWeight: '500', fontFamily: 'DM Sans, sans-serif' }}>Plan</th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#8A7560', fontSize: '13px', fontWeight: '500', fontFamily: 'DM Sans, sans-serif' }}>Amount</th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#8A7560', fontSize: '13px', fontWeight: '500', fontFamily: 'DM Sans, sans-serif' }}>Status</th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#8A7560', fontSize: '13px', fontWeight: '500', fontFamily: 'DM Sans, sans-serif' }}>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id} style={{ borderBottom: '1px solid #2A4A42' }}>
                          <td style={{ padding: '16px', color: '#F7E7CE', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                            {new Date(payment.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '16px', color: '#F7E7CE', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize' }}>
                            {payment.plan}
                          </td>
                          <td style={{ padding: '16px', color: '#D4A853', fontSize: '14px', fontWeight: '600', fontFamily: 'DM Sans, sans-serif' }}>
                            PKR {payment.amount?.toLocaleString()}
                          </td>
                          <td style={{ padding: '16px' }}>
                            {getStatusBadge(payment.status)}
                          </td>
                          <td style={{ padding: '16px', color: '#8A7560', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                            {payment.reference_number}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Section 3 - Upgrade Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#0a1f1b',
              border: '1px solid #2A4A42',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: '#F7E7CE', fontSize: '20px', fontWeight: '600', fontFamily: 'DM Sans, sans-serif' }}>
                  Upgrade to {selectedPlan?.name}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', color: '#8A7560', fontSize: '24px', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              {/* Instructions */}
              <div style={{
                backgroundColor: '#D4A85311',
                border: '1px solid #D4A853',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <div style={{ color: '#D4A853', fontSize: '14px', fontWeight: '600', marginBottom: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                  Send PKR {selectedPlan?.price?.toLocaleString()} to any of these numbers:
                </div>
                <div style={{ color: '#F7E7CE', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', lineHeight: '1.8' }}>
                  <div><strong>JazzCash:</strong> 0300-1234567</div>
                  <div><strong>EasyPaisa:</strong> 0300-1234567</div>
                  <div><strong>Bank:</strong> HBL — Munshi (PK36HABB0000000123456702)</div>
                </div>
                <div style={{ color: '#8A7560', fontSize: '13px', marginTop: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                  Use your email as the reference/description
                </div>
              </div>

              {/* Reference Input */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#F7E7CE', fontSize: '14px', marginBottom: '8px', fontFamily: 'DM Sans, sans-serif' }}>
                  Transaction Reference Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Enter your transaction reference"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0D2420',
                    border: '1px solid #F7E7CE',
                    borderRadius: '8px',
                    color: '#F7E7CE',
                    fontSize: '14px',
                    fontFamily: 'DM Sans, sans-serif',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={submitUpgrade}
                disabled={upgrading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#D4A853',
                  color: '#102C26',
                  fontSize: '14px',
                  fontWeight: '600',
                  fontFamily: 'DM Sans, sans-serif',
                  cursor: upgrading ? 'not-allowed' : 'pointer',
                  opacity: upgrading ? 0.6 : 1
                }}
              >
                {upgrading ? 'Submitting...' : 'Submit Upgrade Request'}
              </button>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: toast.type === 'success' ? '#2A9D8F' : '#E05C5C',
            color: '#F7E7CE',
            padding: '16px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif',
            zIndex: 1001,
            animation: 'slideIn 0.3s ease'
          }}>
            {toast.message}
          </div>
        )}

        <style jsx>{`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  )
}
