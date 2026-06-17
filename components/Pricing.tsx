'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Currency = 'PKR' | 'USD'

const plans = [
    {
        name: 'Starter',
        badge: null,
        pricePKR: 0,
        priceUSD: 0,
        period: '/month',
        desc: 'Try Munshi free. No card required.',
        msgs: '50',
        cta: 'Start Free',
        ctaHref: '/auth/signup',
        ctaPrimary: false,
        features: [
            '50 AI replies/month',
            '1 WhatsApp number',
            'Website training (5 pages)',
            'Roman Urdu + English',
            'Conversation history',
            'Basic bot settings',
        ],
        missing: [
            'PDF training',
            'Analytics dashboard',
            'Operating hours',
        ],
    },
    {
        name: 'Growth',
        badge: 'Most Popular',
        pricePKR: 7000,
        priceUSD: 25,
        period: '/month',
        desc: 'For growing businesses ready to scale.',
        msgs: '5,000',
        cta: 'Get Growth',
        ctaHref: '/auth/signup',
        ctaPrimary: true,
        features: [
            '5,000 AI replies/month',
            '1 WhatsApp number',
            'Website training (20 pages)',
            'PDF + Text training',
            'All 4 languages',
            'Analytics dashboard',
            'Operating hours & away msg',
            'Conversation memory',
        ],
        missing: [],
    },
    {
        name: 'Pro',
        badge: null,
        pricePKR: 30000,
        priceUSD: 99,
        period: '/month',
        desc: 'For teams and high-volume businesses.',
        msgs: '50,000',
        cta: 'Get Pro',
        ctaHref: '/auth/signup',
        ctaPrimary: false,
        features: [
            '50,000 AI replies/month',
            '3 WhatsApp numbers',
            'All training types',
            'All 4 languages',
            'Advanced analytics',
            'Priority support',
            'Instagram DMs (coming soon)',
            'Human handoff (coming soon)',
        ],
        missing: [],
    },
]

export default function Pricing() {
    const headerRef = useRef<HTMLDivElement>(null)
    const cardsRef = useRef<(HTMLDivElement | null)[]>([])
    const enterpriseRef = useRef<HTMLDivElement>(null)
    const [currency, setCurrency] = useState<Currency>('PKR')

    useEffect(() => {
        const obs = new IntersectionObserver(
            entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('in-view')),
            { threshold: 0.1 }
        )
        if (headerRef.current) obs.observe(headerRef.current)
        cardsRef.current.forEach(el => el && obs.observe(el))
        if (enterpriseRef.current) obs.observe(enterpriseRef.current)
        return () => obs.disconnect()
    }, [])

    const fmt = (plan: typeof plans[0]) => {
        if (plan.pricePKR === 0) return 'Free'
        if (currency === 'PKR') return `PKR ${plan.pricePKR.toLocaleString()}`
        return `$${plan.priceUSD}`
    }

    return (
        <>
            <style>{`
        .price-root {
          font-family: 'Geist', sans-serif;
          position: relative;
          color: #e3e2e2;
        }
        .price-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 40px 100px;
        }
        @media (max-width: 768px) { .price-section { padding: 50px 20px 70px; } }

        /* Header */
        .price-header {
          text-align: center;
          margin-bottom: 56px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .price-header.in-view { opacity: 1; transform: translateY(0); }

        .price-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid rgba(74,225,118,0.25);
          background: rgba(74,225,118,0.05);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #4ae176;
          margin-bottom: 24px;
        }

        .price-title {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin: 0 0 12px;
        }

        .price-sub {
          font-size: 16px;
          color: rgba(196,199,200,0.6);
          margin: 0 auto 32px;
          max-width: 440px;
        }

        /* Currency toggle */
        .currency-toggle {
          display: inline-flex;
          align-items: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9999px;
          padding: 4px;
          gap: 2px;
        }

        .currency-btn {
          padding: 7px 18px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          background: transparent;
          color: rgba(196,199,200,0.5);
          font-family: 'Geist', sans-serif;
          transition: all 0.25s ease;
        }
        .currency-btn.active {
          background: #fff;
          color: #000;
        }

        /* Cards grid */
        .price-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 24px;
          align-items: start;
        }
        @media (max-width: 900px) { .price-grid { grid-template-columns: 1fr; } }

        /* Plan card */
        .plan-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          border-radius: 20px;
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s ease;
        }
        .plan-card.in-view { opacity: 1; transform: translateY(0); }
        .plan-card:nth-child(1) { transition-delay: 0s; }
        .plan-card:nth-child(2) { transition-delay: 0.1s; }
        .plan-card:nth-child(3) { transition-delay: 0.2s; }

        .plan-card.popular {
          border-color: rgba(74,225,118,0.3);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(74,225,118,0.15), 0 0 50px rgba(74,225,118,0.08);
          background: rgba(74,225,118,0.04);
        }

        /* Popular badge */
        .popular-badge {
          position: absolute;
          top: -1px;
          left: 50%;
          transform: translateX(-50%);
          background: #4ae176;
          color: #000;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 4px 14px;
          border-radius: 0 0 8px 8px;
        }

        /* Corner glow */
        .plan-corner {
          position: absolute;
          bottom: -40px;
          right: -40px;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(74,225,118,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .plan-name {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(196,199,200,0.6);
          margin-bottom: 16px;
        }

        .plan-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 4px;
        }

        .plan-price-num {
          font-size: clamp(32px, 4vw, 44px);
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1;
          transition: all 0.3s ease;
        }

        .plan-price-period {
          font-size: 14px;
          color: rgba(196,199,200,0.5);
          font-weight: 500;
        }

        .plan-msgs {
          font-size: 12px;
          color: #4ae176;
          font-weight: 600;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .plan-desc {
          font-size: 13px;
          color: rgba(196,199,200,0.55);
          margin-bottom: 28px;
          line-height: 1.5;
        }

        /* CTA */
        .plan-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 13px;
          border-radius: 10px;
          font-family: 'Geist', sans-serif;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: all 0.3s ease;
          margin-bottom: 28px;
        }

        .plan-cta.primary {
          background: #fff;
          color: #000;
          animation: price-glow 2.5s ease-in-out infinite;
        }
        .plan-cta.primary:hover { background: #4ae176; transform: scale(1.02); }

        .plan-cta.secondary {
          background: transparent;
          color: #e3e2e2;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .plan-cta.secondary:hover {
          border-color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.04);
        }

        @keyframes price-glow {
          0%, 100% { box-shadow: 0 0 0 rgba(74,225,118,0); }
          50% { box-shadow: 0 0 20px rgba(74,225,118,0.4); }
        }

        /* Divider */
        .plan-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin-bottom: 20px;
        }

        /* Features */
        .plan-features { display: flex; flex-direction: column; gap: 10px; }

        .plan-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: rgba(196,199,200,0.8);
        }

        .feat-check {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: rgba(74,225,118,0.12);
          border: 1px solid rgba(74,225,118,0.25);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .feat-cross {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .plan-feature.missing { color: rgba(196,199,200,0.3); }

        /* Enterprise card */
        .enterprise-card {
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 32px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s ease;
          transition-delay: 0.3s;
        }
        .enterprise-card.in-view { opacity: 1; transform: translateY(0); }
        .enterprise-card:hover { border-color: rgba(255,255,255,0.15); }

        .enterprise-left { flex: 1; min-width: 200px; }
        .enterprise-name {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(196,199,200,0.5);
          margin-bottom: 8px;
        }
        .enterprise-title {
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .enterprise-desc {
          font-size: 14px;
          color: rgba(196,199,200,0.55);
          line-height: 1.5;
        }

        .enterprise-features {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        .enterprise-feat {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          color: rgba(196,199,200,0.7);
          white-space: nowrap;
        }

        .enterprise-cta {
          padding: 13px 28px;
          border-radius: 10px;
          font-family: 'Geist', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .enterprise-cta:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.35);
        }
      `}</style>

            <div className="price-root" id="pricing">
                <div className="price-section">

                    {/* Header */}
                    <div className="price-header" ref={headerRef}>
                        <div className="price-eyebrow">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" fill="#4ae176" opacity="0.8" />
                            </svg>
                            Pricing
                        </div>
                        <h2 className="price-title">Simple, Honest Pricing</h2>
                        <p className="price-sub">Start free. Upgrade when you need more.</p>
                        <div className="currency-toggle">
                            <button
                                className={`currency-btn ${currency === 'PKR' ? 'active' : ''}`}
                                onClick={() => setCurrency('PKR')}
                            >
                                🇵🇰 PKR
                            </button>
                            <button
                                className={`currency-btn ${currency === 'USD' ? 'active' : ''}`}
                                onClick={() => setCurrency('USD')}
                            >
                                🌍 USD
                            </button>
                        </div>
                    </div>

                    {/* Plans */}
                    <div className="price-grid">
                        {plans.map((plan, i) => (
                            <div
                                key={i}
                                ref={el => { cardsRef.current[i] = el }}
                                className={`plan-card ${plan.badge ? 'popular' : ''}`}
                            >
                                {plan.badge && <div className="popular-badge">{plan.badge}</div>}
                                <div className="plan-corner" />

                                <div className="plan-name">{plan.name}</div>

                                <div className="plan-price">
                                    <span className="plan-price-num">{fmt(plan)}</span>
                                    {plan.pricePKR > 0 && <span className="plan-price-period">{plan.period}</span>}
                                </div>

                                <div className="plan-msgs">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                        <path d="M21 11.5C21 16.7 16.7 21 11.5 21C9.6 21 7.8 20.5 6.3 19.5L3 21L4.5 17.7C3.5 16.2 3 14.4 3 12.5C3 7.3 7.3 3 12.5 3C17.7 3 21 7.3 21 11.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                    </svg>
                                    {plan.msgs} messages/month
                                </div>

                                <div className="plan-desc">{plan.desc}</div>

                                <Link href={plan.ctaHref} className={`plan-cta ${plan.ctaPrimary ? 'primary' : 'secondary'}`}>
                                    {plan.cta}
                                </Link>

                                <div className="plan-divider" />

                                <div className="plan-features">
                                    {plan.features.map((f, j) => (
                                        <div key={j} className="plan-feature">
                                            <div className="feat-check">
                                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                                                    <path d="M20 6L9 17L4 12" stroke="#4ae176" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            {f}
                                        </div>
                                    ))}
                                    {plan.missing.map((f, j) => (
                                        <div key={j} className="plan-feature missing">
                                            <div className="feat-cross">
                                                <svg width="7" height="7" viewBox="0 0 24 24" fill="none">
                                                    <path d="M18 6L6 18M6 6L18 18" stroke="rgba(196,199,200,0.3)" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </div>
                                            {f}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Enterprise */}
                    <div className="enterprise-card" ref={enterpriseRef}>
                        <div className="enterprise-left">
                            <div className="enterprise-name">Enterprise</div>
                            <div className="enterprise-title">Need more? Let's talk.</div>
                            <div className="enterprise-desc">Custom limits, dedicated support, API access, and white-label options.</div>
                        </div>
                        <div className="enterprise-features">
                            {[
                                'Unlimited messages',
                                'Dedicated support',
                                'Custom integrations',
                                'White-label option',
                            ].map((f, i) => (
                                <div key={i} className="enterprise-feat">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 6L9 17L4 12" stroke="#4ae176" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    {f}
                                </div>
                            ))}
                        </div>
                        <a href="mailto:support@munshi.pk" className="enterprise-cta">
                            Contact Sales
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M5 12H19M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </div>

                </div>
            </div>
        </>
    )
}