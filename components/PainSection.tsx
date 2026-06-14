'use client'

import React, { useEffect, useRef } from 'react'

const painPoints = [
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 16.92V19.92C22 20.47 21.55 20.92 21 20.92C9.4 20.92 0 11.52 0 -0.0800018C0 -0.630002 0.45 -1.08 1 -1.08H4C4.55 -1.08 5 -0.630002 5 -0.0800018C5 1.42 5.25 2.86 5.72 4.2C5.86 4.62 5.76 5.09 5.45 5.4L3.9 6.95C5.07 9.81 7.19 11.93 10.05 13.1L11.6 11.55C11.91 11.24 12.38 11.14 12.8 11.28C14.14 11.75 15.58 12 17.08 12C17.63 12 18.08 12.45 18.08 13V16C18.08 16.55 17.63 17 17.08 17" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(2.5, 3.5)" />
                <path d="M2 2L22 22" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            </svg>
        ),
        title: 'Missed WhatsApp Messages',
        body: "Customers don't wait. If you reply late, they message someone else."
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        title: 'Leads Arrive After Hours',
        body: 'Your business sleeps. Potential customers don\u2019t.'
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#4ae176" strokeWidth="1.5" />
                <path d="M12 7V12L15 14" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        title: 'Slow Replies Kill Conversions',
        body: 'The first business to respond usually wins.'
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="3" width="16" height="18" rx="2" stroke="#4ae176" strokeWidth="1.5" />
                <path d="M8 7H16M8 11H16M8 15H12" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
        title: 'Important Leads Get Lost',
        body: 'Customer details disappear inside endless chat history.'
    },
]

export default function PainSection() {
    const sectionRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const closingRef = useRef<HTMLDivElement>(null)
    const transitionRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view')
                    }
                })
            },
            { threshold: 0.15 }
        )

        cardRefs.current.forEach(el => el && observer.observe(el))
        if (closingRef.current) observer.observe(closingRef.current)
        if (transitionRef.current) observer.observe(transitionRef.current)

        return () => observer.disconnect()
    }, [])

    return (
        <>
            <style>{`
        .pain-root {
          font-family: 'Geist', sans-serif;
          background: #000000;
          position: relative;
          overflow: hidden;
          color: #e3e2e2;
        }
        .pain-mesh {
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(circle at 80% 20%, rgba(74,225,118,0.05) 0%, transparent 45%),
            radial-gradient(circle at 20% 80%, rgba(255,255,255,0.02) 0%, transparent 45%);
        }
        .pain-section {
          position: relative;
          z-index: 10;
          max-width: 1280px;
          margin: 0 auto;
          padding: 100px 40px;
        }
        @media (max-width: 768px) {
          .pain-section { padding: 70px 20px; }
        }
        .pain-header {
          text-align: center;
          margin-bottom: 64px;
        }
        .pain-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid rgba(255,180,171,0.25);
          background: rgba(255,180,171,0.04);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #ffb4ab;
          margin-bottom: 24px;
        }
        .pain-title {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin: 0;
        }
        .pain-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 56px;
        }
        @media (max-width: 1024px) {
          .pain-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .pain-grid { grid-template-columns: 1fr; }
        }
        .pain-card {
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 28px 24px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s ease;
        }
        .pain-card.in-view {
          opacity: 1;
          transform: translateY(0);
        }
        .pain-card:nth-child(1) { transition-delay: 0s; }
        .pain-card:nth-child(2) { transition-delay: 0.1s; }
        .pain-card:nth-child(3) { transition-delay: 0.2s; }
        .pain-card:nth-child(4) { transition-delay: 0.3s; }
        .pain-card:hover {
          border-color: rgba(74,225,118,0.25);
          transform: translateY(-4px);
        }
        .pain-icon-wrap {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: rgba(74,225,118,0.08);
          border: 1px solid rgba(74,225,118,0.15);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }
        .pain-card-title {
          font-size: 17px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          margin: 0 0 10px;
        }
        .pain-card-body {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(196,199,200,0.6);
          margin: 0;
        }
        .pain-closing {
          text-align: center;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s ease, transform 0.7s ease;
          transition-delay: 0.2s;
        }
        .pain-closing.in-view {
          opacity: 1;
          transform: translateY(0);
        }
        .pain-closing-text {
          font-size: clamp(20px, 3vw, 30px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.03em;
          line-height: 1.4;
          max-width: 700px;
          margin: 0 auto;
        }
        .pain-closing-text .highlight {
          color: #ffb4ab;
        }

        /* Transition section */
        .transition-section {
          position: relative;
          z-index: 10;
          max-width: 720px;
          margin: 0 auto;
          padding: 60px 40px 120px;
          text-align: center;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .transition-section.in-view {
          opacity: 1;
          transform: translateY(0);
        }
        @media (max-width: 768px) {
          .transition-section { padding: 40px 20px 80px; }
        }
        .transition-eyebrow {
          font-size: 14px;
          font-weight: 700;
          color: rgba(196,199,200,0.5);
          letter-spacing: 0.05em;
          margin-bottom: 20px;
        }
        .transition-text {
          font-size: clamp(22px, 3.5vw, 36px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.03em;
          line-height: 1.4;
          margin: 0;
        }
        .transition-text .accent {
          color: #4ae176;
        }
        .transition-divider {
          width: 1px;
          height: 60px;
          background: linear-gradient(to bottom, rgba(74,225,118,0.4), transparent);
          margin: 40px auto 0;
        }
      `}</style>

            <div className="pain-root" ref={sectionRef}>
                <div className="pain-mesh" />

                {/* Pain Section */}
                <div className="pain-section">
                    <div className="pain-header">
                        <div className="pain-eyebrow">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 0 0 3.54 21H20.46A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z" stroke="#ffb4ab" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            The Problem
                        </div>
                        <h2 className="pain-title">You're Losing Customers Every Day</h2>
                    </div>

                    <div className="pain-grid">
                        {painPoints.map((point, i) => (
                            <div
                                key={i}
                                ref={el => { cardRefs.current[i] = el }}
                                className="pain-card"
                            >
                                <div className="pain-icon-wrap">{point.icon}</div>
                                <h3 className="pain-card-title">{point.title}</h3>
                                <p className="pain-card-body">{point.body}</p>
                            </div>
                        ))}
                    </div>

                    <div className="pain-closing" ref={closingRef}>
                        <p className="pain-closing-text">
                            Every missed message is <span className="highlight">revenue walking straight to your competitors.</span>
                        </p>
                    </div>
                </div>

                {/* Micro Transition */}
                <div className="transition-section" ref={transitionRef}>
                    <div className="transition-eyebrow">The good news?</div>
                    <p className="transition-text">
                        You don't need a bigger team, more working hours, or another employee.
                        <br /><br />
                        You need a system that <span className="accent">never misses a customer.</span>
                    </p>
                    <div className="transition-divider" />
                </div>
            </div>
        </>
    )
}