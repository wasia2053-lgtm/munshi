'use client'

import React, { useEffect, useRef, useState } from 'react'

const industries = [
    {
        title: 'E-commerce & Online Stores',
        desc: 'Answer product questions, share prices, and guide customers to checkout — automatically.',
        example: '"Do you deliver to Lahore?" → instant reply with delivery info.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 6H21M16 10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        title: 'Real Estate',
        desc: 'Qualify leads, share property details, and book viewings — even at midnight.',
        example: '"10 marla plot DHA Lahore?" → details + viewing link sent instantly.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 22V12H15V22" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        title: 'Car Dealerships',
        desc: 'Share specs, prices, and availability. Let Munshi pre-qualify every buyer.',
        example: '"Civic 2022 price?" → full spec sheet + finance options.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 17H3V11L5.5 6H18.5L21 11V17H19M5 17C5 18.1 5.9 19 7 19C8.1 19 9 18.1 9 17M5 17C5 15.9 5.9 15 7 15C8.1 15 9 15.9 9 17M15 17C15 18.1 15.9 19 17 19C18.1 19 19 18.1 19 17M15 17C15 15.9 15.9 15 17 15C18.1 15 19 15.9 19 17" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 17H15" stroke="#4ae176" strokeWidth="1.5" />
            </svg>
        ),
    },
    {
        title: 'Clinics & Healthcare',
        desc: 'Book appointments, answer FAQs, and send reminders without a receptionist.',
        example: '"I need an appointment" → availability shown, slot booked.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 12H18L15 21L9 3L6 12H2" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        title: 'Coaching & Education',
        desc: 'Answer course queries, share fees, and enrol students automatically.',
        example: '"What are your IELTS batch timings?" → schedule + fee shared.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M2 3H8C9.1 3 10 3.9 10 5V19C10 20.1 9.1 21 8 21H2V3ZM16 3H22V21H16C14.9 21 14 20.1 14 19V5C14 3.9 14.9 3 16 3Z" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 12H14" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        title: 'Restaurants & Food',
        desc: 'Take orders, share menus, handle delivery queries — 24/7 without staff.',
        example: '"What\'s today\'s deal?" → menu + special sent in seconds.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 8H19C20.1 8 21 8.9 21 10V14C21 15.1 20.1 16 19 16H18M18 8V16M18 8H6M18 16H6M6 8H5C3.9 8 3 8.9 3 10V14C3 15.1 3.9 16 5 16H6M6 8V16" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 8V16M8 12H16" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
    },
]

export default function WhoIsItFor() {
    const headerRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const obs = new IntersectionObserver(
            entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('in-view')),
            { threshold: 0.12 }
        )
        if (headerRef.current) obs.observe(headerRef.current)
        cardRefs.current.forEach(el => el && obs.observe(el))
        return () => obs.disconnect()
    }, [])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, i: number) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        setHoveredCard(i)
    }

    return (
        <>
            <style>{`
        .who-root {
          font-family: 'Geist', sans-serif;
          position: relative;
          color: #e3e2e2;
        }
        .who-section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 40px 100px;
        }
        @media (max-width: 768px) { .who-section { padding: 50px 20px 70px; } }

        .who-header {
          text-align: center;
          margin-bottom: 64px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .who-header.in-view { opacity: 1; transform: translateY(0); }

        .who-eyebrow {
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

        .who-title {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin: 0 0 12px;
        }

        .who-sub {
          font-size: 16px;
          color: rgba(196,199,200,0.6);
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Grid */
        .who-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) { .who-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .who-grid { grid-template-columns: 1fr; } }

        /* Card */
        .who-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          border-radius: 20px;
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
          cursor: default;
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .who-card.in-view { opacity: 1; transform: translateY(0); }
        .who-card:nth-child(1) { transition-delay: 0s; }
        .who-card:nth-child(2) { transition-delay: 0.08s; }
        .who-card:nth-child(3) { transition-delay: 0.16s; }
        .who-card:nth-child(4) { transition-delay: 0.24s; }
        .who-card:nth-child(5) { transition-delay: 0.32s; }
        .who-card:nth-child(6) { transition-delay: 0.4s; }

        .who-card:hover {
          border-color: rgba(74,225,118,0.25);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(74,225,118,0.07);
          transform: translateY(-6px);
        }

        .who-card-glow {
          position: absolute;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(74,225,118,0.12) 0%, transparent 70%);
          pointer-events: none;
          transform: translate(-50%, -50%);
          z-index: 0;
          transition: opacity 0.3s;
        }

        /* Corner accent */
        .who-corner {
          position: absolute;
          top: 0;
          right: 0;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle at top right, rgba(74,225,118,0.08) 0%, transparent 70%);
          border-radius: 0 20px 0 0;
          pointer-events: none;
          z-index: 0;
        }

        .who-content { position: relative; z-index: 1; }

        .who-icon-wrap {
          width: 52px; height: 52px;
          border-radius: 14px;
          background: rgba(74,225,118,0.08);
          border: 1px solid rgba(74,225,118,0.18);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 22px;
          transition: all 0.35s ease;
        }
        .who-card:hover .who-icon-wrap {
          background: rgba(74,225,118,0.15);
          border-color: rgba(74,225,118,0.4);
          box-shadow: 0 0 24px rgba(74,225,118,0.2);
          transform: scale(1.08);
        }

        .who-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          margin: 0 0 10px;
          line-height: 1.3;
        }

        .who-card-desc {
          font-size: 14px;
          line-height: 1.65;
          color: rgba(196,199,200,0.6);
          margin: 0 0 16px;
        }

        .who-example {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          font-size: 12px;
          color: rgba(196,199,200,0.55);
          line-height: 1.5;
          transition: all 0.3s ease;
        }
        .who-card:hover .who-example {
          background: rgba(74,225,118,0.04);
          border-color: rgba(74,225,118,0.12);
          color: rgba(196,199,200,0.75);
        }
        .example-icon {
          flex-shrink: 0;
          margin-top: 1px;
          color: #4ae176;
          opacity: 0.7;
        }

        /* Bottom pill */
        .who-bottom {
          margin-top: 56px;
          text-align: center;
        }
        .who-bottom-text {
          font-size: 18px;
          color: rgba(196,199,200,0.7);
          margin-bottom: 8px;
        }
        .who-bottom-text strong { color: #fff; }
        .who-bottom-sub {
          font-size: 14px;
          color: rgba(196,199,200,0.4);
        }
      `}</style>

            <div className="who-root">
                <div className="who-section">

                    {/* Header */}
                    <div className="who-header" ref={headerRef}>
                        <div className="who-eyebrow">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M17 21V19C17 17.9 16.1 17 15 17H9C7.9 17 7 17.9 7 19V21M12 11C13.7 11 15 9.7 15 8C15 6.3 13.7 5 12 5C10.3 5 9 6.3 9 8C9 9.7 10.3 11 12 11Z" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M20 21V19C20 17.1 18.7 15.5 17 15M4 21V19C4 17.1 5.3 15.5 7 15" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            Who It's For
                        </div>
                        <h2 className="who-title">Made for Businesses That Sell on WhatsApp</h2>
                        <p className="who-sub">If customers message you on WhatsApp, Munshi was built for your business.</p>
                    </div>

                    {/* Cards */}
                    <div className="who-grid">
                        {industries.map((item, i) => (
                            <div
                                key={i}
                                className="who-card"
                                ref={el => { cardRefs.current[i] = el }}
                                onMouseMove={e => handleMouseMove(e, i)}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                {hoveredCard === i && (
                                    <div className="who-card-glow" style={{ left: mousePos.x, top: mousePos.y }} />
                                )}
                                <div className="who-corner" />
                                <div className="who-content">
                                    <div className="who-icon-wrap">{item.icon}</div>
                                    <h3 className="who-card-title">{item.title}</h3>
                                    <p className="who-card-desc">{item.desc}</p>
                                    <div className="who-example">
                                        <svg className="example-icon" width="13" height="13" viewBox="0 0 24 24" fill="none">
                                            <path d="M21 11.5C21 16.7 16.7 21 11.5 21C9.6 21 7.8 20.5 6.3 19.5L3 21L4.5 17.7C3.5 16.2 3 14.4 3 12.5C3 7.3 7.3 3 12.5 3C17.7 3 21 7.3 21 11.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                        </svg>
                                        {item.example}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom note */}
                    <div className="who-bottom">
                        <p className="who-bottom-text">
                            Don't see your industry? <strong>Munshi works for any business</strong> that gets customer messages.
                        </p>
                        <p className="who-bottom-sub">Retail, services, agencies, freelancers — all welcome.</p>
                    </div>

                </div>
            </div>
        </>
    )
}