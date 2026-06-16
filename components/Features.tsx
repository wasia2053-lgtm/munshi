'use client'

import React, { useEffect, useRef, useState } from 'react'

const languages = [
    { flag: '🇬🇧', label: 'English UK', code: 'EN-GB' },
    { flag: '🇺🇸', label: 'English US', code: 'EN-US' },
    { flag: '🇸🇦', label: 'Arabic', code: 'AR' },
    { flag: '🇵🇰', label: 'Roman Urdu', code: 'UR' },
]

const trainingTypes = [
    { icon: '🌐', label: 'Website', sub: 'Auto-crawl up to 20 pages' },
    { icon: '📄', label: 'PDF Docs', sub: 'Upload any document' },
    { icon: '✍️', label: 'Text Input', sub: 'Paste product info' },
]

export default function Features() {
    const sectionRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const [activeLang, setActiveLang] = useState(0)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('in-view')),
            { threshold: 0.1 }
        )
        cardRefs.current.forEach(el => el && observer.observe(el))
        return () => observer.disconnect()
    }, [])

    // Language rotator
    useEffect(() => {
        const iv = setInterval(() => setActiveLang(p => (p + 1) % languages.length), 2000)
        return () => clearInterval(iv)
    }, [])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, i: number) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        setHoveredCard(i)
    }

    return (
        <>
            <style>{`
        .feat-root {
          font-family: 'Geist', sans-serif;
          position: relative;
          color: #e3e2e2;
        }
        .feat-section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 40px 100px;
        }
        @media (max-width: 768px) { .feat-section { padding: 50px 20px 70px; } }

        .feat-header {
          text-align: center;
          margin-bottom: 64px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .feat-header.in-view { opacity: 1; transform: translateY(0); }
        .feat-eyebrow {
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
        .feat-title {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin: 0;
        }

        /* BENTO GRID */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-template-rows: auto;
          gap: 16px;
        }
        @media (max-width: 900px) {
          .bento-grid { grid-template-columns: 1fr; }
        }

        /* Base card */
        .b-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          border-radius: 20px;
          padding: 32px;
          position: relative;
          overflow: hidden;
          cursor: default;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .b-card.in-view { opacity: 1; transform: translateY(0); }
        .b-card:hover {
          border-color: rgba(74,225,118,0.2);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(74,225,118,0.06);
        }

        /* Mouse-follow glow inside card */
        .card-glow {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(74,225,118,0.15) 0%, transparent 70%);
          pointer-events: none;
          transform: translate(-50%, -50%);
          transition: opacity 0.3s;
          z-index: 0;
        }

        /* Grid placements */
        .b-lang    { grid-column: span 5; }
        .b-247     { grid-column: span 3; }
        .b-memory  { grid-column: span 4; }
        .b-train   { grid-column: span 7; }
        .b-hours   { grid-column: span 5; }
        .b-crm     { grid-column: span 4; }
        .b-followup { grid-column: span 4; }
        .b-excel   { grid-column: span 4; }

        @media (max-width: 900px) {
          .b-lang, .b-247, .b-memory, .b-train, .b-hours, .b-crm, .b-followup, .b-excel {
            grid-column: span 1;
          }
        }

        /* Transition delays */
        .b-card:nth-child(1) { transition-delay: 0s; }
        .b-card:nth-child(2) { transition-delay: 0.08s; }
        .b-card:nth-child(3) { transition-delay: 0.16s; }
        .b-card:nth-child(4) { transition-delay: 0.24s; }
        .b-card:nth-child(5) { transition-delay: 0.32s; }
        .b-card:nth-child(6) { transition-delay: 0.08s; }
        .b-card:nth-child(7) { transition-delay: 0.16s; }
        .b-card:nth-child(8) { transition-delay: 0.24s; }

        /* Card content */
        .b-content { position: relative; z-index: 1; }
        .b-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(196,199,200,0.5);
          margin-bottom: 12px;
        }
        .b-title {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          margin: 0 0 8px;
        }
        .b-sub {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(196,199,200,0.6);
        }
        .b-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: rgba(74,225,118,0.08);
          border: 1px solid rgba(74,225,118,0.18);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }
        .b-card:hover .b-icon {
          background: rgba(74,225,118,0.14);
          border-color: rgba(74,225,118,0.35);
          box-shadow: 0 0 20px rgba(74,225,118,0.2);
        }

        /* Coming Soon badge */
        .coming-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 9999px;
          padding: 4px 10px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(196,199,200,0.6);
          z-index: 2;
        }
        .coming-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #4ae176;
          animation: coming-pulse 2s infinite;
        }
        @keyframes coming-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* Language card specifics */
        .lang-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 20px;
        }
        .lang-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          font-size: 13px;
          color: rgba(196,199,200,0.7);
          transition: all 0.35s ease;
        }
        .lang-pill.active {
          border-color: rgba(74,225,118,0.4);
          background: rgba(74,225,118,0.08);
          color: #fff;
        }
        .lang-flag { font-size: 18px; line-height: 1; }
        .lang-code {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #4ae176;
          margin-left: 2px;
        }

        /* 24/7 card */
        .big-stat {
          font-size: 56px;
          font-weight: 800;
          letter-spacing: -0.06em;
          color: #fff;
          line-height: 1;
          margin: 8px 0 4px;
        }
        .big-stat span { color: #4ae176; }
        .stat-sub { font-size: 13px; color: rgba(196,199,200,0.5); }

        /* Memory card - typing preview */
        .memory-preview {
          margin-top: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(196,199,200,0.7);
        }
        .memory-highlight { color: #4ae176; font-weight: 600; }

        /* Training card */
        .train-pills {
          display: flex;
          gap: 10px;
          margin-top: 24px;
          flex-wrap: wrap;
        }
        .train-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          flex: 1;
          min-width: 130px;
          transition: all 0.3s ease;
        }
        .train-pill:hover {
          border-color: rgba(74,225,118,0.3);
          background: rgba(74,225,118,0.05);
        }
        .train-pill-icon { font-size: 20px; }
        .train-pill-label { font-size: 13px; font-weight: 600; color: #fff; }
        .train-pill-sub { font-size: 11px; color: rgba(196,199,200,0.5); }

        /* Hours card */
        .hours-visual {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .hour-block {
          width: 20px;
          height: 32px;
          border-radius: 4px;
          transition: all 0.3s;
        }
        .hour-block.active { background: #4ae176; opacity: 0.85; }
        .hour-block.inactive { background: rgba(255,255,255,0.06); }
        .hours-label {
          font-size: 11px;
          color: rgba(196,199,200,0.4);
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
        }

        /* CRM card lock overlay */
        .coming-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.15);
          border-radius: inherit;
          z-index: 1;
          backdrop-filter: blur(0px);
        }

        /* Decorative corner gradient */
        .corner-glow {
          position: absolute;
          bottom: -30px;
          right: -30px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(74,225,118,0.12) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
      `}</style>

            <div className="feat-root" id="features">
                <div className="feat-section">
                    {/* Header */}
                    <div className="feat-header" ref={el => { cardRefs.current[0] = el }}>
                        <div className="feat-eyebrow">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#4ae176" strokeWidth="1.5" strokeLinejoin="round" />
                                <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="#4ae176" strokeWidth="1.5" strokeLinejoin="round" />
                            </svg>
                            Everything You Need
                        </div>
                        <h2 className="feat-title">Built for Businesses That Sell on WhatsApp</h2>
                    </div>

                    {/* Bento Grid */}
                    <div className="bento-grid">

                        {/* 1. Language card — span 5 */}
                        <div
                            className="b-card b-lang"
                            ref={el => { cardRefs.current[1] = el }}
                            onMouseMove={e => handleMouseMove(e, 1)}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            {hoveredCard === 1 && <div className="card-glow" style={{ left: mousePos.x, top: mousePos.y }} />}
                            <div className="corner-glow" />
                            <div className="b-content">
                                <div className="b-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="9" stroke="#4ae176" strokeWidth="1.5" />
                                        <path d="M12 3C12 3 8 7 8 12C8 17 12 21 12 21M12 3C12 3 16 7 16 12C16 17 12 21 12 21M3 12H21" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div className="b-title">4 Languages, 1 Bot</div>
                                <div className="b-sub">Munshi auto-detects your customer's language and replies accordingly — every time.</div>
                                <div className="lang-pills">
                                    {languages.map((lang, i) => (
                                        <div key={i} className={`lang-pill ${activeLang === i ? 'active' : ''}`}>
                                            <span className="lang-flag">{lang.flag}</span>
                                            <span>{lang.label}</span>
                                            {activeLang === i && <span className="lang-code">{lang.code}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 2. 24/7 card — span 3 */}
                        <div
                            className="b-card b-247"
                            ref={el => { cardRefs.current[2] = el }}
                            onMouseMove={e => handleMouseMove(e, 2)}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            {hoveredCard === 2 && <div className="card-glow" style={{ left: mousePos.x, top: mousePos.y }} />}
                            <div className="corner-glow" />
                            <div className="b-content">
                                <div className="b-label">Availability</div>
                                <div className="big-stat">24<span>/7</span></div>
                                <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(196,199,200,0.6)', lineHeight: 1.5 }}>
                                    Never miss a customer message — even at 3am or on weekends.
                                </p>
                            </div>
                        </div>

                        {/* 3. Memory card — span 4 */}
                        <div
                            className="b-card b-memory"
                            ref={el => { cardRefs.current[3] = el }}
                            onMouseMove={e => handleMouseMove(e, 3)}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            {hoveredCard === 3 && <div className="card-glow" style={{ left: mousePos.x, top: mousePos.y }} />}
                            <div className="corner-glow" />
                            <div className="b-content">
                                <div className="b-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                        <path d="M21 16V8C21 6.9 20.1 6 19 6H5C3.9 6 3 6.9 3 8V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16Z" stroke="#4ae176" strokeWidth="1.5" />
                                        <path d="M7 10H17M7 14H13" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div className="b-title">Conversation Memory</div>
                                <div className="memory-preview">
                                    Welcome back, <span className="memory-highlight">Ali!</span> Last time you asked about the
                                    <span className="memory-highlight"> Honda Civic 2022</span>. Still interested?
                                </div>
                            </div>
                        </div>

                        {/* 4. Training card — span 7 */}
                        <div
                            className="b-card b-train"
                            ref={el => { cardRefs.current[4] = el }}
                            onMouseMove={e => handleMouseMove(e, 4)}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            {hoveredCard === 4 && <div className="card-glow" style={{ left: mousePos.x, top: mousePos.y }} />}
                            <div className="corner-glow" />
                            <div className="b-content">
                                <div className="b-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#4ae176" strokeWidth="1.5" strokeLinejoin="round" />
                                        <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="#4ae176" strokeWidth="1.5" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="b-title">Train on Your Entire Business</div>
                                <div className="b-sub">Add your website, PDFs, or type in product info. Munshi reads and learns everything — automatically.</div>
                                <div className="train-pills">
                                    {trainingTypes.map((t, i) => (
                                        <div key={i} className="train-pill">
                                            <span className="train-pill-icon">{t.icon}</span>
                                            <div>
                                                <div className="train-pill-label">{t.label}</div>
                                                <div className="train-pill-sub">{t.sub}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 5. Operating Hours — span 5 */}
                        <div
                            className="b-card b-hours"
                            ref={el => { cardRefs.current[5] = el }}
                            onMouseMove={e => handleMouseMove(e, 5)}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            {hoveredCard === 5 && <div className="card-glow" style={{ left: mousePos.x, top: mousePos.y }} />}
                            <div className="corner-glow" />
                            <div className="b-content">
                                <div className="b-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="9" stroke="#4ae176" strokeWidth="1.5" />
                                        <path d="M12 7V12L15 14" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div className="b-title">Smart Operating Hours</div>
                                <div className="b-sub">Set your business hours. Outside them, Munshi sends a custom away message automatically.</div>
                                <div className="hours-visual">
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <div key={i} className={`hour-block ${i >= 9 && i <= 17 ? 'active' : 'inactive'}`} />
                                    ))}
                                </div>
                                <div className="hours-label">
                                    <span>12am</span><span>9am</span><span>5pm</span><span>12am</span>
                                </div>
                            </div>
                        </div>

                        {/* 6. CRM — Coming Soon — span 4 */}
                        <div
                            className="b-card b-crm"
                            ref={el => { cardRefs.current[6] = el }}
                        >
                            <div className="coming-overlay" />
                            <div className="coming-badge"><span className="coming-dot" />Coming Soon</div>
                            <div className="corner-glow" />
                            <div className="b-content" style={{ opacity: 0.5 }}>
                                <div className="b-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                        <path d="M17 21V19C17 17.9 16.1 17 15 17H9C7.9 17 7 17.9 7 19V21M12 11C13.7 11 15 9.7 15 8C15 6.3 13.7 5 12 5C10.3 5 9 6.3 9 8C9 9.7 10.3 11 12 11Z" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M20 21V19C20 17.1 18.7 15.5 17 15M4 21V19C4 17.1 5.3 15.5 7 15M16 3.1C17.7 3.6 19 5.2 19 7C19 8.8 17.7 10.4 16 10.9" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div className="b-title">Lead CRM</div>
                                <div className="b-sub">Every customer conversation auto-creates a contact with name, phone, and interest.</div>
                            </div>
                        </div>

                        {/* 7. Follow-ups — Coming Soon — span 4 */}
                        <div
                            className="b-card b-followup"
                            ref={el => { cardRefs.current[7] = el }}
                        >
                            <div className="coming-overlay" />
                            <div className="coming-badge"><span className="coming-dot" />Coming Soon</div>
                            <div className="corner-glow" />
                            <div className="b-content" style={{ opacity: 0.5 }}>
                                <div className="b-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                        <path d="M18 8C18 6.4 17.4 4.9 16.2 3.8C15.1 2.6 13.6 2 12 2C10.4 2 8.9 2.6 7.8 3.8C6.6 4.9 6 6.4 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8ZM13.7 20C13.5 20.3 13.3 20.6 13 20.8C12.7 21 12.4 21 12 21C11.6 21 11.3 21 11 20.8C10.7 20.6 10.5 20.3 10.3 20" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="b-title">Auto Follow-ups</div>
                                <div className="b-sub">Munshi reminds hot leads automatically. "Main kal bataunga" — handled.</div>
                            </div>
                        </div>

                        {/* 8. Excel Export — Coming Soon — span 4 */}
                        <div
                            className="b-card b-excel"
                            ref={el => { cardRefs.current[8] = el }}
                        >
                            <div className="coming-overlay" />
                            <div className="coming-badge"><span className="coming-dot" />Coming Soon</div>
                            <div className="corner-glow" />
                            <div className="b-content" style={{ opacity: 0.5 }}>
                                <div className="b-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M14 2V8H20M8 13H16M8 17H16M10 9H8" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="b-title">Excel / Sheets Export</div>
                                <div className="b-sub">Export all your leads and customer data to Excel or Google Sheets in one click.</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    )
}