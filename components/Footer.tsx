"use client";
import Link from 'next/link';
import { BrandLogo } from "@/components/brand-logo";

const links = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  Company: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refund-policy' },
  ],
  Support: [
    { label: 'Contact', href: 'mailto:support@munshi.pk' },
    { label: 'WhatsApp', href: 'https://wa.me/923001234567' },
  ]
}

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '64px 24px 40px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '48px',
        marginBottom: '64px'
      }}>
        {/* Brand */}
        <div>
          <BrandLogo variant="full" height="32px" style={{ marginBottom: '12px' }} />
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', lineHeight: 1.6, maxWidth: '200px' }}>
            WhatsApp AI that works while you sleep. Built for SMBs.
          </p>
        </div>

        {/* Links */}
        {Object.entries(links).map(([group, items]) => (
          <div key={group}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
              {group}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map(item => (
                <Link key={item.label} href={item.href} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>
          © 2026 Munshi AI. All rights reserved.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>
          Built with Meta WhatsApp API · Powered by Groq
        </p>
      </div>
    </footer>
  )
}
