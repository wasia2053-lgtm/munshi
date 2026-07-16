import React from 'react'
import Link from 'next/link'
import { BrandLogo } from "@/components/brand-logo"

interface Section {
    title: string
    content: React.ReactNode
}

interface PolicyLayoutProps {
    title: string
    subtitle: string
    effectiveDate: string
    sections: Section[]
    badge?: string
}

export default function PolicyLayout({ title, subtitle, effectiveDate, sections, badge }: PolicyLayoutProps) {
    return (
        <>
            <style>{`
        .policy-root {
          font-family: 'Geist', 'Inter', sans-serif;
          background: #121314;
          min-height: 100vh;
          color: #e3e2e2;
        }
        .policy-mesh {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(at 0% 0%, rgba(74,225,118,0.04) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(255,255,255,0.02) 0px, transparent 50%);
        }
        .policy-header {
          position: relative;
          z-index: 10;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 0 40px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        @media (max-width: 640px) { .policy-header { padding: 0 20px; } }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .brand-icon {
          display: none;
        }
        .brand-name {
          display: none;
        }
        .back-btn {
          font-size: 13px;
          color: rgba(196,199,200,0.6);
          text-decoration: none;
          display: flex; align-items: center; gap: 6px;
          transition: color 0.2s;
        }
        .back-btn:hover { color: #fff; }
        .policy-main {
          position: relative;
          z-index: 10;
          max-width: 760px;
          margin: 0 auto;
          padding: 64px 24px 80px;
        }
        .policy-hero {
          text-align: center;
          margin-bottom: 56px;
        }
        .policy-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(74,225,118,0.08);
          border: 1px solid rgba(74,225,118,0.2);
          border-radius: 9999px;
          padding: 5px 14px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #4ae176;
          margin-bottom: 24px;
        }
        .policy-title {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin-bottom: 12px;
        }
        .policy-sub {
          font-size: 15px;
          color: rgba(196,199,200,0.6);
          margin-bottom: 8px;
        }
        .policy-date {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(196,199,200,0.35);
        }
        .policy-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          margin: 40px 0;
        }
        .policy-section {
          margin-bottom: 40px;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .section-num {
          width: 24px; height: 24px;
          background: rgba(74,225,118,0.1);
          border: 1px solid rgba(74,225,118,0.2);
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #4ae176;
          flex-shrink: 0;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .section-body {
          font-size: 15px;
          line-height: 1.75;
          color: rgba(196,199,200,0.8);
          padding-left: 36px;
        }
        .section-body p { margin-bottom: 12px; }
        .section-body ul, .section-body ol {
          padding-left: 20px;
          margin-bottom: 12px;
        }
        .section-body li { margin-bottom: 8px; }
        .section-body strong { color: #e3e2e2; font-weight: 600; }
        .highlight-box {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-left: 3px solid #4ae176;
          border-radius: 8px;
          padding: 16px 20px;
          margin: 16px 0;
          font-size: 14px;
          color: rgba(196,199,200,0.8);
          line-height: 1.6;
        }
        .contact-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          margin-top: 16px;
        }
        .contact-email {
          font-size: 18px;
          font-weight: 600;
          color: #4ae176;
          margin-bottom: 6px;
        }
        .contact-sub {
          font-size: 13px;
          color: rgba(196,199,200,0.5);
        }
        .policy-footer {
          position: relative;
          z-index: 10;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 32px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        @media (max-width: 640px) { .policy-footer { padding: 24px 20px; flex-direction: column; text-align: center; } }
        .footer-copy {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(196,199,200,0.3);
        }
        .footer-links {
          display: flex;
          gap: 24px;
        }
        .footer-link {
          font-size: 13px;
          color: rgba(196,199,200,0.5);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-link:hover { color: #4ae176; }
      `}</style>

            <div className="policy-root">
                <div className="policy-mesh" />

                {/* Header */}
                <header className="policy-header">
                    <Link href="/" className="brand">
                        <BrandLogo variant="full" height="36px" />
                    </Link>
                    <Link href="/" className="back-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back to Home
                    </Link>
                </header>

                {/* Main */}
                <main className="policy-main">
                    {/* Hero */}
                    <div className="policy-hero">
                        {badge && <div className="policy-badge">{badge}</div>}
                        <h1 className="policy-title">{title}</h1>
                        <p className="policy-sub">{subtitle}</p>
                        <p className="policy-date">Effective Date: {effectiveDate}</p>
                    </div>

                    <div className="policy-divider" />

                    {/* Sections */}
                    {sections.map((section, i) => (
                        <div key={i} className="policy-section">
                            <div className="section-header">
                                <div className="section-num">{String(i + 1).padStart(2, '0')}</div>
                                <h2 className="section-title">{section.title}</h2>
                            </div>
                            <div className="section-body">{section.content}</div>
                        </div>
                    ))}
                </main>

                {/* Footer */}
                <footer className="policy-footer">
                    <span className="footer-copy">© {new Date().getFullYear()} Munshi AI — All rights reserved.</span>
                    <div className="footer-links">
                        <Link href="/privacy-policy" className="footer-link">Privacy</Link>
                        <Link href="/terms" className="footer-link">Terms</Link>
                        <Link href="/refund-policy" className="footer-link">Refund</Link>
                    </div>
                </footer>
            </div>
        </>
    )
}