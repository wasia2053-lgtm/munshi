'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    badge: null,
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
      'Basic AI bot',
      'Website training (5 pages)',
      'English, Roman Urdu & Arabic',
      'Conversation history',
    ],
    missing: ['PDF training', 'Text training', 'Operating hours', 'Analytics dashboard', 'Conversation memory'],
  },
  {
    name: 'Basic',
    badge: null,
    priceUSD: 4,
    period: '/month',
    desc: 'Perfect first step for small businesses.',
    msgs: '1,000',
    cta: 'Get Basic',
    ctaHref: '/auth/signup',
    ctaPrimary: false,
    features: [
      '1,000 AI replies/month',
      '1 WhatsApp number',
      'Basic AI bot',
      'Website training (10 pages)',
      'PDF + Text training',
      'English, Roman Urdu & Arabic',
      'Operating hours & away message',
      'Email support',
    ],
    missing: ['Analytics dashboard', 'Conversation memory'],
  },
  {
    name: 'Growth',
    badge: 'Most Popular',
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
      'Advanced AI + context memory',
      'Website training (20 pages)',
      'PDF + Text training',
      'English, Roman Urdu & Arabic',
      'Operating hours & away message',
      'Analytics dashboard',
      'Custom bot personality',
      'Priority email support',
    ],
    missing: [],
  },
  {
    name: 'Pro',
    badge: null,
    priceUSD: 99,
    period: '/month',
    desc: 'For teams and high-volume businesses.',
    msgs: '20,000',
    cta: 'Get Pro',
    ctaHref: '/auth/signup',
    ctaPrimary: false,
    features: [
      '20,000 AI replies/month',
      '1 WhatsApp number',
      'Advanced AI + context memory',
      'Website training (25 pages)',
      'PDF + Text training',
      'English, Roman Urdu & Arabic',
      'Advanced analytics',
      'Priority support',
      '3 WhatsApp numbers (coming soon)',
      'Human handoff inbox (coming soon)',
      'Instagram + Facebook DMs (coming soon)',
    ],
    missing: [],
  },
]

export default function Pricing() {
  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])
  const enterpriseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('in-view')),
      { threshold: 0.08 }
    )
    if (headerRef.current) obs.observe(headerRef.current)
    cardsRef.current.forEach(el => el && obs.observe(el))
    if (enterpriseRef.current) obs.observe(enterpriseRef.current)
    return () => obs.disconnect()
  }, [])

  const fmt = (plan: typeof plans[0]) => {
    if (plan.priceUSD === 0) return 'Free'
    return `$${plan.priceUSD}`
  }

  return (
    <>
      <style>{`
        .price-root { font-family: 'Geist', sans-serif; position: relative; color: #e3e2e2; }
        .price-section { max-width: 1280px; margin: 0 auto; padding: 80px 40px 100px; }
        @media (max-width: 768px) { .price-section { padding: 50px 20px 70px; } }

        .price-header {
          text-align: center; margin-bottom: 56px;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .price-header.in-view { opacity: 1; transform: translateY(0); }

        .price-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 9999px;
          border: 1px solid rgba(74,225,118,0.25);
          background: rgba(74,225,118,0.05);
          font-size: 12px; font-weight: 700; letter-spacing: 0.15em;
          text-transform: uppercase; color: #4ae176; margin-bottom: 24px;
        }
        .price-title {
          font-size: clamp(32px, 5vw, 52px); font-weight: 700;
          color: #fff; letter-spacing: -0.04em; line-height: 1.1; margin: 0 0 12px;
        }
        .price-sub { font-size: 16px; color: rgba(196,199,200,0.6); margin: 0 auto; max-width: 440px; }

        /* 4-column grid */
        .price-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px; margin-bottom: 20px; align-items: start;
        }
        @media (max-width: 1100px) { .price-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .price-grid { grid-template-columns: 1fr; } }

        .plan-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          border-radius: 20px; padding: 28px 24px;
          position: relative; overflow: hidden;
          opacity: 0; transform: translateY(28px);
          transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s ease;
        }
        .plan-card.in-view { opacity: 1; transform: translateY(0); }
        .plan-card:nth-child(1) { transition-delay: 0s; }
        .plan-card:nth-child(2) { transition-delay: 0.08s; }
        .plan-card:nth-child(3) { transition-delay: 0.16s; }
        .plan-card:nth-child(4) { transition-delay: 0.24s; }

        .plan-card.popular {
          border-color: rgba(74,225,118,0.35);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 50px rgba(74,225,118,0.1);
          background: rgba(74,225,118,0.04);
        }

        .popular-badge {
          position: absolute; top: -1px; left: 50%; transform: translateX(-50%);
          background: #4ae176; color: #000;
          font-size: 9px; font-weight: 800; letter-spacing: 0.15em;
          text-transform: uppercase; padding: 4px 12px; border-radius: 0 0 8px 8px;
          white-space: nowrap;
        }

        .plan-corner {
          position: absolute; bottom: -40px; right: -40px;
          width: 120px; height: 120px; border-radius: 50%;
          background: radial-gradient(circle, rgba(74,225,118,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .plan-name {
          font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(196,199,200,0.5); margin-bottom: 14px;
        }

        .plan-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
        .plan-price-num {
          font-size: clamp(26px, 3.5vw, 36px); font-weight: 800;
          color: #fff; letter-spacing: -0.04em; line-height: 1; transition: all 0.3s;
        }
        .plan-price-period { font-size: 13px; color: rgba(196,199,200,0.5); }

        .plan-meta { font-size: 12px; line-height: 1.5; color: rgba(196,199,200,0.55); margin: -8px 0 16px; }
        .meta-note {
          max-width: 760px; margin: 28px auto 0; padding: 16px 20px; border-radius: 12px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          font-size: 14px; line-height: 1.6; color: rgba(196,199,200,0.85); text-align: left;
        }
        .meta-note strong { color: #fff; }
        .meta-note a { color: #fff; text-decoration: underline; text-underline-offset: 2px; }
        .plan-msgs {
          font-size: 12px; color: #4ae176; font-weight: 600;
          margin-bottom: 6px; display: flex; align-items: center; gap: 5px;
        }
        .plan-desc { font-size: 13px; color: rgba(196,199,200,0.5); margin-bottom: 24px; line-height: 1.5; }

        .plan-cta {
          display: flex; align-items: center; justify-content: center;
          width: 100%; padding: 12px; border-radius: 10px;
          font-family: 'Geist', sans-serif; font-size: 14px; font-weight: 700;
          text-decoration: none; cursor: pointer; border: none;
          transition: all 0.3s; margin-bottom: 24px; box-sizing: border-box;
        }
        .plan-cta.primary {
          background: #fff; color: #000;
          animation: price-glow 2.5s ease-in-out infinite;
        }
        .plan-cta.primary:hover { background: #4ae176; transform: scale(1.02); }
        .plan-cta.secondary {
          background: transparent; color: #e3e2e2;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .plan-cta.secondary:hover { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.04); }

        @keyframes price-glow {
          0%, 100% { box-shadow: 0 0 0 rgba(74,225,118,0); }
          50% { box-shadow: 0 0 20px rgba(74,225,118,0.4); }
        }

        .plan-divider { height: 1px; background: rgba(255,255,255,0.06); margin-bottom: 18px; }
        .plan-features { display: flex; flex-direction: column; gap: 9px; }
        .plan-feature { display: flex; align-items: flex-start; gap: 9px; font-size: 13px; color: rgba(196,199,200,0.8); }
        .plan-feature.missing { color: rgba(196,199,200,0.3); }

        .feat-check {
          width: 16px; height: 16px; border-radius: 50%;
          background: rgba(74,225,118,0.12); border: 1px solid rgba(74,225,118,0.25);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
        }
        .feat-cross {
          width: 16px; height: 16px; border-radius: 50%;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
        }

        /* Enterprise */
        .enterprise-card {
          background: rgba(255,255,255,0.02); backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
          padding: 28px 36px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 20px; flex-wrap: wrap;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s ease;
          transition-delay: 0.3s;
        }
        .enterprise-card.in-view { opacity: 1; transform: translateY(0); }
        .enterprise-card:hover { border-color: rgba(255,255,255,0.15); }

        .enterprise-left { flex: 1; min-width: 180px; }
        .enterprise-name { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(196,199,200,0.4); margin-bottom: 6px; }
        .enterprise-title { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: -0.02em; margin-bottom: 4px; }
        .enterprise-desc { font-size: 13px; color: rgba(196,199,200,0.5); line-height: 1.5; }

        .enterprise-feats {
          display: flex; gap: 20px; flex-wrap: wrap; flex: 2;
        }
        .enterprise-feat {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: rgba(196,199,200,0.7); white-space: nowrap;
        }

        .enterprise-cta {
          padding: 12px 24px; border-radius: 10px;
          font-family: 'Geist', sans-serif; font-size: 14px; font-weight: 700;
          color: #fff; background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          cursor: pointer; text-decoration: none; white-space: nowrap;
          transition: all 0.3s; display: inline-flex; align-items: center; gap: 8px;
        }
        .enterprise-cta:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.35); }
      `}</style>

      <div className="price-root" id="pricing">
        <div className="price-section">
          {/* Header */}
          <div className="price-header" ref={headerRef}>
            <div className="price-eyebrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Pricing
            </div>
            <h2 className="price-title">Simple, Honest Pricing</h2>
            <p className="price-sub">Start free. Upgrade when you're ready. Prices in USD.</p>
          </div>

          {/* 4 Plans */}
          <div className="price-grid">
            {plans.map((plan, i) => (
              <div key={i} ref={el => { cardsRef.current[i] = el }} className={`plan-card ${plan.badge ? 'popular' : ''}`}>
                {plan.badge && <div className="popular-badge">{plan.badge}</div>}
                <div className="plan-corner" />
                <div className="plan-name">{plan.name}</div>
                <div className="plan-price">
                  <span className="plan-price-num">{fmt(plan)}</span>
                  {plan.priceUSD > 0 && <span className="plan-price-period">{plan.period}</span>}
                </div>
                <div className="plan-msgs">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 11.5C21 16.7 16.7 21 11.5 21C9.6 21 7.8 20.5 6.3 19.5L3 21L4.5 17.7C3.5 16.2 3 14.4 3 12.5C3 7.3 7.3 3 12.5 3C17.7 3 21 7.3 21 11.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                  {plan.msgs} messages/month
                </div>
                <div className="plan-meta">+ Meta's WhatsApp charges, billed separately by Meta</div>
                <div className="plan-desc">{plan.desc}</div>
                <Link href={plan.ctaHref} className={`plan-cta ${plan.ctaPrimary ? 'primary' : 'secondary'}`}>{plan.cta}</Link>
                <div className="plan-divider" />
                <div className="plan-features">
                  {plan.features.map((f, j) => (
                    <div key={j} className="plan-feature">
                      <div className="feat-check"><svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#4ae176" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                      {f}
                    </div>
                  ))}
                  {plan.missing.map((f, j) => (
                    <div key={j} className="plan-feature missing">
                      <div className="feat-cross"><svg width="7" height="7" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="rgba(196,199,200,0.3)" strokeWidth="2" strokeLinecap="round" /></svg></div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="meta-note">
            <strong>Two separate bills.</strong> You pay Munshi&apos;s fee (above) to Munshi. Meta&apos;s WhatsApp messaging charges are billed separately by Meta to your own WhatsApp Business account. They are not included in Munshi&apos;s price. Meta charges per message beyond a monthly free allowance per number. Rates are set by Meta, depend on your customer&apos;s country and can change. Munshi never collects, marks up or pays these charges. <a href="https://developers.facebook.com/docs/whatsapp/pricing" target="_blank" rel="noopener noreferrer">See Meta&apos;s current rates</a>.
          </div>

          {/* Enterprise */}
          <div className="enterprise-card" ref={enterpriseRef}>
            <div className="enterprise-left">
              <div className="enterprise-name">Enterprise</div>
              <div className="enterprise-title">Need more? Let's talk.</div>
              <div className="enterprise-desc">Custom limits, support and integrations, scoped to your needs.</div>
            </div>
            <div className="enterprise-feats">
              {['Custom message limits', 'Dedicated support', 'Custom integrations', 'White-label (on request)'].map((f, i) => (
                <div key={i} className="enterprise-feat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#4ae176" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {f}
                </div>
              ))}
            </div>
            <a href="mailto:support@munshi.pk" className="enterprise-cta">
              Contact Sales
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}