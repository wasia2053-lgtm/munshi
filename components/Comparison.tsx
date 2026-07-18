'use client'

import React, { useEffect, useRef, useState } from 'react'
import { BrandLogo } from "@/components/brand-logo"
const rows = [
  {
    feature: 'Monthly Cost',
    human: 'PKR 40,000–80,000+',
    munshi: 'From PKR 0',
    humanIcon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="currentColor" opacity="0.4" /></svg>
    ),
    munshiBetter: true,
  },
  {
    feature: 'Availability',
    human: 'Office hours only',
    munshi: '24 / 7 / 365',
    munshiIcon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /><path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
    ),
    munshiBetter: true,
  },
  {
    feature: 'Response Speed',
    human: '5–30 minutes',
    munshi: 'Under 3 seconds',
    munshiBetter: true,
  },
  {
    feature: 'Languages',
    human: '1–2 max',
    munshi: 'English, Arabic, Roman Urdu',
    munshiBetter: true,
  },
  {
    feature: 'Simultaneous Chats',
    human: '1 at a time',
    munshi: 'Unlimited',
    munshiBetter: true,
  },
  {
    feature: 'Setup Time',
    human: 'Weeks of hiring',
    munshi: '5 minutes',
    munshiBetter: true,
  },
  {
    feature: 'Knowledge Updates',
    human: 'Retrain constantly',
    munshi: 'Update website once',
    munshiBetter: true,
  },
  {
    feature: 'Consistency',
    human: 'Depends on mood',
    munshi: 'Always on-brand',
    munshiBetter: true,
  },
  {
    feature: 'Human Touch',
    human: 'Full empathy',
    munshi: 'Handoff available (Pro)',
    munshiBetter: false,
    neutral: true,
  },
]

export default function Comparison() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const [visibleRows, setVisibleRows] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('in-view')
      }),
      { threshold: 0.1 }
    )
    if (headerRef.current) obs.observe(headerRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting && !started.current) {
          started.current = true
          rows.forEach((_, i) => {
            setTimeout(() => setVisibleRows(p => p + 1), i * 80)
          })
        }
      }),
      { threshold: 0.15 }
    )
    if (tableRef.current) obs.observe(tableRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <style>{`
        .cmp-root {
          font-family: 'Geist', sans-serif;
          position: relative;
          color: #e3e2e2;
        }
        .cmp-section {
          max-width: 1100px;
          margin: 0 auto;
          padding: 80px 40px 100px;
        }
        @media (max-width: 768px) { .cmp-section { padding: 50px 20px 70px; } }

        .cmp-header {
          text-align: center;
          margin-bottom: 64px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .cmp-header.in-view { opacity: 1; transform: translateY(0); }

        .cmp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid rgba(255,180,171,0.25);
          background: rgba(255,180,171,0.05);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #ffb4ab;
          margin-bottom: 24px;
        }

        .cmp-title {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin: 0 0 12px;
        }

        .cmp-sub {
          font-size: 16px;
          color: rgba(196,199,200,0.6);
          max-width: 480px;
          margin: 0 auto;
        }

        /* Table wrapper */
        .cmp-table-wrap {
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
          border-radius: 20px;
          overflow: hidden;
          overflow-x: auto;
        }

        .cmp-table-inner {
          min-width: 520px;
        }

        /* Col headers */
        .cmp-col-headers {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .cmp-col-head {
          padding: 24px 28px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .cmp-col-head.feature-col {
          color: rgba(196,199,200,0.4);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-size: 11px;
        }

        .cmp-col-head.human-col {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(196,199,200,0.6);
          border-left: 1px solid rgba(255,255,255,0.05);
        }

        .human-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
        }

        .cmp-col-head.munshi-col {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(74,225,118,0.05);
          border-left: 1px solid rgba(74,225,118,0.15);
          color: #4ae176;
          position: relative;
        }

        .munshi-avatar {
          width: 28px; height: 28px;
          border-radius: 8px;
          background: #4ae176;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #000;
        }

        .munshi-winner-badge {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(74,225,118,0.15);
          border: 1px solid rgba(74,225,118,0.25);
          border-radius: 9999px;
          padding: 3px 10px;
          font-size: 10px;
          font-weight: 700;
          color: #4ae176;
          letter-spacing: 0.1em;
        }

        /* Rows */
        .cmp-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          opacity: 0;
          transform: translateX(-10px);
          transition: opacity 0.35s ease, transform 0.35s ease, background 0.2s ease;
        }
        .cmp-row.row-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .cmp-row:last-child { border-bottom: none; }
        .cmp-row:hover { background: rgba(255,255,255,0.015); }

        .cmp-cell {
          padding: 18px 28px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cmp-cell.feat-cell {
          color: rgba(196,199,200,0.8);
          font-weight: 500;
        }

        .cmp-cell.human-cell {
          color: rgba(196,199,200,0.45);
          border-left: 1px solid rgba(255,255,255,0.04);
        }

        .cmp-cell.munshi-cell {
          border-left: 1px solid rgba(74,225,118,0.08);
          background: rgba(74,225,118,0.02);
          color: #e3e2e2;
          font-weight: 500;
          position: relative;
        }

        .cmp-cell.neutral-cell {
          background: rgba(255,255,255,0.015);
        }

        .check-icon {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: rgba(74,225,118,0.12);
          border: 1px solid rgba(74,225,118,0.25);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .cross-icon {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: rgba(255,180,171,0.08);
          border: 1px solid rgba(255,180,171,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .neutral-icon {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* Bottom CTA strip */
        .cmp-bottom {
          margin-top: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          text-align: center;
        }

        .cmp-cta-text {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .cmp-cta-text span { color: #4ae176; }

        .cmp-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: #fff;
          color: #000;
          font-family: 'Geist', sans-serif;
          font-size: 14px;
          font-weight: 700;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s ease;
          animation: cta-glow 2.5s ease-in-out infinite;
        }

        .cmp-cta-btn:hover { background: #4ae176; transform: scale(1.03); }

        @keyframes cta-glow {
          0%, 100% { box-shadow: 0 0 0px rgba(74,225,118,0); }
          50% { box-shadow: 0 0 24px rgba(74,225,118,0.45); }
        }
      `}</style>

      <div className="cmp-root">
        <div className="cmp-section">

          {/* Header */}
          <div className="cmp-header" ref={headerRef}>
            <div className="cmp-eyebrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M17 21V19C17 17.9 16.1 17 15 17H9C7.9 17 7 17.9 7 19V21M12 11C13.7 11 15 9.7 15 8C15 6.3 13.7 5 12 5C10.3 5 9 6.3 9 8C9 9.7 10.3 11 12 11Z" stroke="#ffb4ab" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              The Real Comparison
            </div>
            <h2 className="cmp-title">Why Not Just Hire Someone?</h2>
            <p className="cmp-sub">A human agent vs Munshi AI — the honest breakdown.</p>
          </div>

          {/* Table */}
          <div className="cmp-table-wrap" ref={tableRef}>
            <div className="cmp-table-inner">
              {/* Column headers */}
              <div className="cmp-col-headers">
                <div className="cmp-col-head feature-col">Feature</div>
                <div className="cmp-col-head human-col">
                  <div className="human-avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21V19C20 17.9 19.1 17 18 17H6C4.9 17 4 17.9 4 19V21M12 11C13.7 11 15 9.7 15 8C15 6.3 13.7 5 12 5C10.3 5 9 6.3 9 8C9 9.7 10.3 11 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  Human Agent
                </div>
                <div className="cmp-col-head munshi-col">
                  <BrandLogo variant="full" height="20px" />
                  <span className="munshi-winner-badge">WINS</span>
                </div>
              </div>

              {/* Rows */}
              {rows.map((row, i) => (
                <div
                  key={i}
                  className={`cmp-row ${i < visibleRows ? 'row-visible' : ''}`}
                  style={{ transitionDelay: `${i * 0.04}s` }}
                >
                  <div className="cmp-cell feat-cell">
                    {row.feature}
                  </div>

                  <div className="cmp-cell human-cell">
                    <div className="cross-icon">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="#ffb4ab" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    {row.human}
                  </div>

                  <div className={`cmp-cell munshi-cell ${row.neutral ? 'neutral-cell' : ''}`}>
                    {row.neutral ? (
                      <div className="neutral-icon">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12H19" stroke="rgba(196,199,200,0.6)" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    ) : (
                      <div className="check-icon">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="#4ae176" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    {row.munshi}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="cmp-bottom">
          <p className="cmp-cta-text">
            Same result. <span>A fraction of the cost.</span>
          </p>
          <a href="/auth/signup" className="cmp-cta-btn">
            Try Free — No Card Needed
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

      </div>
    </>
  )
}