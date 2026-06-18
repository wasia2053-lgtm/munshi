"use client"
import Link from 'next/link'

export default function FinalCTA() {
  return (
    <section style={{ padding: '80px 24px 120px', textAlign: 'center' }}>
      <div style={{
        maxWidth: '680px',
        margin: '0 auto',
        background: 'rgba(74,225,118,0.04)',
        border: '1px solid rgba(74,225,118,0.15)',
        borderRadius: '24px',
        padding: 'clamp(48px, 6vw, 80px) clamp(32px, 5vw, 72px)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow blob */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(74,225,118,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <p style={{ color: '#4ae176', fontSize: '13px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Get Started Free
        </p>
        <h2 style={{ color: '#fff', fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 700, lineHeight: 1.2, marginBottom: '16px' }}>
          Your business doesn't sleep.<br />Neither does Munshi.
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', lineHeight: 1.6, marginBottom: '40px', maxWidth: '480px', margin: '0 auto 40px' }}>
          Set up in 5 minutes. Start free. Upgrade when you're ready.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/signup" style={{
            display: 'inline-block',
            background: '#4ae176',
            color: '#000',
            padding: '14px 32px',
            borderRadius: '100px',
            fontSize: '15px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Start for free →
          </Link>
          <Link href="/auth/login" style={{
            display: 'inline-block',
            background: 'transparent',
            color: 'rgba(255,255,255,0.6)',
            padding: '14px 32px',
            borderRadius: '100px',
            fontSize: '15px',
            fontWeight: 500,
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.12)',
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          >
            Sign in
          </Link>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', marginTop: '24px' }}>
          No credit card · 50 messages free · Cancel anytime
        </p>
      </div>
    </section>
  )
}
