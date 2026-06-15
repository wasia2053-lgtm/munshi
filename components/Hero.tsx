'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'

export default function Hero() {
  const spotlightRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      if (spotlightRef.current) {
        spotlightRef.current.style.left = `${clientX}px`
        spotlightRef.current.style.top = `${clientY}px`
      }
      cardsRef.current.forEach(card => {
        if (!card) return
        const rect = card.getBoundingClientRect()
        const cardX = rect.left + rect.width / 2
        const cardY = rect.top + rect.height / 2
        const angleX = (clientY - cardY) / 40
        const angleY = (clientX - cardX) / -40
        card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.02)`
      })
    }
    const handleMouseLeave = () => {
      cardsRef.current.forEach(card => {
        if (card) card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <>
      <style>{`
        .hero-root {
          font-family: 'Geist', sans-serif;
          position: relative;
          color: #e3e2e2;
        }
        .spotlight {
          pointer-events: none;
          position: fixed;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(74,225,118,0.12) 0%, transparent 70%);
          z-index: 1;
          transform: translate(-50%, -50%);
          mix-blend-mode: screen;
        }
        .hero-main {
          position: relative;
          z-index: 10;
          padding-top: 140px;
          padding-bottom: 60px;
          max-width: 1280px;
          margin: 0 auto;
          padding-left: 40px;
          padding-right: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
          min-height: 80vh;
        }
        @media (max-width: 1024px) {
          .hero-main {
            grid-template-columns: 1fr;
            min-height: auto;
            padding-top: 110px;
          }
        }
        @media (max-width: 480px) {
          .hero-main { padding-top: 120px; }
        }
        @media (max-width: 768px) {
          .hero-main { padding-left: 20px; padding-right: 20px; gap: 40px; }
        }
        .hero-left {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid rgba(74,225,118,0.3);
          background: rgba(74,225,118,0.05);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #4ae176;
          width: fit-content;
        }
        .pulse-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #4ae176;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .hero-title {
          font-size: clamp(36px, 5.5vw, 64px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.05;
          max-width: 600px;
          margin: 0;
        }
        .hero-title .accent { color: #4ae176; }
        .hero-sub {
          font-size: 18px;
          color: rgba(196,199,200,0.7);
          line-height: 1.6;
          max-width: 520px;
        }
        .hero-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          padding-top: 8px;
        }
        .btn-primary {
          background: #fff;
          color: #000;
          font-size: 15px;
          font-weight: 700;
          padding: 16px 36px;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          transition: all 0.3s;
          animation: btn-glow-pulse 2.5s ease-in-out infinite;
        }
        @keyframes btn-glow-pulse {
          0%, 100% { box-shadow: 0 0 0px rgba(74,225,118,0); }
          50% { box-shadow: 0 0 24px rgba(74,225,118,0.5); }
        }
        .btn-primary:hover { background: #4ae176; gap: 14px; }
        .btn-secondary {
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          padding: 16px 36px;
          border-radius: 9999px;
          background: transparent;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.05); }
        .hero-trust {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 24px;
        }
        .trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          font-size: 13px;
          color: rgba(196,199,200,0.75);
          white-space: nowrap;
        }
        .trust-badge svg { color: #4ae176; flex-shrink: 0; }
        /* Right side - floating glass cards */
        .hero-right {
          position: relative;
          height: 600px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 1024px) {
          .hero-right { height: 500px; margin-top: 20px; }
        }
        @media (max-width: 480px) {
          .hero-right { height: 440px; }
        }
        .glass-card {
          backdrop-filter: blur(24px);
          background: rgba(18,19,20,0.5);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          border-radius: 16px;
          transition: transform 0.6s cubic-bezier(0.22,1,0.36,1), border-color 0.3s ease;
        }
        .glass-card:hover { border-color: rgba(107,255,143,0.3); }
        .floating { animation: floating 6s ease-in-out infinite; }
        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        .card-customer {
          position: absolute;
          top: 0; left: 0;
          width: 230px;
          padding: 16px;
        }
        @media (max-width: 480px) { .card-customer { width: 180px; left: -10px; } }
        .card-ai {
          position: absolute;
          top: 160px; right: 0;
          width: 270px;
          padding: 20px;
          z-index: 30;
        }
        @media (max-width: 480px) { .card-ai { width: 210px; right: -10px; top: 140px; } }
        .card-lead {
          position: absolute;
          bottom: 140px; left: 20px;
          width: 210px;
          padding: 16px;
          z-index: 40;
        }
        @media (max-width: 480px) { .card-lead { width: 170px; left: -5px; bottom: 110px; } }
        .card-calendar {
          position: absolute;
          bottom: 20px; right: 0;
          width: 230px;
          padding: 16px;
          z-index: 20;
        }
        @media (max-width: 480px) { .card-calendar { width: 185px; right: -10px; bottom: 0px; } }
        .card-growth {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 180px;
          padding: 16px;
          z-index: 10;
          opacity: 0.55;
          filter: blur(0.5px);
        }
        @media (max-width: 480px) { .card-growth { width: 140px; } }
        .mini-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(196,199,200,0.5);
        }
        .chip-icon {
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bubble {
          background: rgba(255,255,255,0.04);
          border-radius: 12px 12px 12px 0;
          padding: 10px 12px;
          font-size: 13px;
          line-height: 1.5;
          color: #e3e2e2;
          margin-top: 10px;
        }
        .bubble-ai {
          background: rgba(74,225,118,0.08);
          border: 1px solid rgba(74,225,118,0.2);
          border-radius: 12px 12px 0 12px;
          padding: 10px 12px;
          font-size: 13px;
          line-height: 1.5;
          color: #e3e2e2;
          margin-top: 10px;
        }
        .timestamp {
          font-size: 9px;
          color: rgba(196,199,200,0.35);
          margin-top: 4px;
          text-align: right;
        }
      `}</style>

      <div className="hero-root">
        <div ref={spotlightRef} className="spotlight" />

        {/* Hero Main */}
        <div className="hero-main">
          {/* Left */}
          <div className="hero-left">
            <div className="hero-badge">
              <span className="pulse-dot" />
              For WhatsApp Businesses
            </div>

            <h1 className="hero-title">
              Stop Losing Customers <span className="accent">After Business Hours</span>
            </h1>

            <p className="hero-sub">
              Munshi replies instantly, captures leads, and keeps your business available 24/7 — even while you sleep. Train it once on your business, and it works around the clock.
            </p>

            <div className="hero-actions">
              <Link href="/auth/signup" className="btn-primary">
                Start Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a href="#how-it-works" className="btn-secondary">See How It Works</a>
            </div>

            <div className="hero-trust">
              <div className="trust-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                No credit card required
              </div>
              <div className="trust-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Setup in 5 minutes
              </div>
              <div className="trust-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Cancel anytime
              </div>
            </div>
          </div>

          {/* Right — floating cards */}
          <div className="hero-right">
            {/* Customer message */}
            <div ref={el => { cardsRef.current[0] = el }} className="glass-card card-customer floating" style={{ animationDelay: '-1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div className="chip-icon" style={{ background: 'rgba(74,225,118,0.12)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 21V19C20 17.9 19.6 16.9 18.8 16.2C18.1 15.4 17.1 15 16 15H8C6.9 15 5.9 15.4 5.2 16.2C4.4 16.9 4 17.9 4 19V21" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" /><circle cx="12" cy="7" r="4" stroke="#4ae176" strokeWidth="1.5" /></svg>
                </div>
                <div className="mini-label">Customer Inquiry</div>
              </div>
              <div className="bubble">Hi! Do you have the Civic 2022 in white? What's the price?</div>
              <div className="timestamp">10:42 AM</div>
            </div>

            {/* AI response */}
            <div ref={el => { cardsRef.current[1] = el }} className="glass-card card-ai floating" style={{ animationDelay: '-2.5s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="chip-icon" style={{ background: '#4ae176' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="10" rx="2" stroke="#000" strokeWidth="1.5" /><circle cx="8" cy="16" r="1" fill="#000" /><circle cx="16" cy="16" r="1" fill="#000" /><path d="M12 11V7M9 7H15" stroke="#000" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </div>
                  <div className="mini-label" style={{ color: '#4ae176' }}>Munshi AI</div>
                </div>
                <span style={{ fontSize: 10, color: '#4ae176', fontFamily: 'monospace' }}>typing...</span>
              </div>
              <div className="bubble-ai">Yes! White Civic 2022, 1.5L, automatic — Rs 65 lakh. Want me to book a viewing this week?</div>
            </div>

            {/* Customer Interested / Lead Captured */}
            <div ref={el => { cardsRef.current[2] = el }} className="glass-card card-lead floating" style={{ animationDelay: '-4s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#4ae176', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(74,225,118,0.4)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div>
                  <div className="mini-label">Customer Interested</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Lead Captured</div>
                </div>
              </div>
            </div>

            {/* Conversation saved */}
            <div ref={el => { cardsRef.current[3] = el }} className="glass-card card-calendar floating" style={{ animationDelay: '-5.5s' }}>
              <div className="mini-label" style={{ marginBottom: 10 }}>Conversation Saved</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', padding: 8, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 11.5C21 16.7 16.7 21 11.5 21C9.6 21 7.8 20.5 6.3 19.5L3 21L4.5 17.7C3.5 16.2 3 14.4 3 12.5C3 7.3 7.3 3 12.5 3C17.7 3 21 7.3 21 11.5Z" stroke="#4ae176" strokeWidth="1.5" /></svg>
                </div>
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: '#fff' }}>Ali Raza</div>
                  <div style={{ fontSize: 11, color: 'rgba(196,199,200,0.6)' }}>Civic 2022 · 03001234567</div>
                </div>
              </div>
            </div>

            {/* Growth */}
            <div ref={el => { cardsRef.current[4] = el }} className="glass-card card-growth">
              <div className="mini-label" style={{ marginBottom: 4 }}>Weekly Replies</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#4ae176', marginBottom: 8 }}>+42%</div>
              <svg width="100%" height="36" viewBox="0 0 100 40" preserveAspectRatio="none">
                <path d="M0,35 Q10,32 20,38 T40,25 T60,30 T80,10 T100,5" fill="none" stroke="#4ae176" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}