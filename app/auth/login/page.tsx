'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const glow1Ref = useRef<HTMLDivElement>(null)
  const glow2Ref = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const moveX1 = (e.clientX - window.innerWidth / 2) * 0.05
      const moveY1 = (e.clientY - window.innerHeight / 2) * 0.05
      const moveX2 = (e.clientX - window.innerWidth / 2) * -0.03
      const moveY2 = (e.clientY - window.innerHeight / 2) * -0.03
      if (glow1Ref.current) glow1Ref.current.style.transform = `translate(${moveX1}px, ${moveY1}px)`
      if (glow2Ref.current) glow2Ref.current.style.transform = `translate(${moveX2}px, ${moveY2}px)`
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) console.error('Google sign in error:', error)
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        await supabase.auth.getSession()
        window.location.href = '/dashboard'
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleInputFocus = () => {
    if (cardRef.current) {
      cardRef.current.style.borderColor = 'rgba(74, 225, 118, 0.2)'
      cardRef.current.style.transition = 'border-color 0.5s ease'
    }
  }

  const handleInputBlur = () => {
    if (cardRef.current) {
      cardRef.current.style.borderColor = 'rgba(255, 255, 255, 0.08)'
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@100;300;400;500;600;700;800;900&display=swap');
        
        .login-body {
          font-family: 'Geist', sans-serif;
          background: radial-gradient(circle at 50% 50%, #121314 0%, #000000 100%);
          min-height: 100vh;
          color: #e3e2e2;
          overflow: hidden;
        }

        .ambient-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }

        .glass-card {
          backdrop-filter: blur(24px);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
          border-radius: 12px;
          padding: 20px 28px;
        }

        @media (min-width: 768px) {
          .glass-card { padding: 20px 28px; }
        }

        .input-field {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px 14px;
          font-family: 'Geist', sans-serif;
          font-size: 14px;
          color: #e3e2e2;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .input-field::placeholder {
          color: rgba(196, 199, 200, 0.3);
        }

        .input-field:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.4) !important;
          background: rgba(255, 255, 255, 0.06) !important;
        }

        .btn-google {
          width: 100%;
          height: 44px; padding: 11px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: white;
          color: #2f3131;
          font-family: 'Geist', sans-serif;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-google:hover { background: rgba(255,255,255,0.9); }
        .btn-google:active { transform: scale(0.98); }

        .btn-primary {
          width: 100%;
          height: 44px; padding: 11px;
          background: #ffffff;
          color: #2f3131;
          font-family: 'Geist', sans-serif;
          font-size: 14px;
          font-weight: 700;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover { background: rgba(255,255,255,0.9); }
        .btn-primary:active { transform: scale(0.99); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .divider-text {
          position: relative;
          padding: 14px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .divider-line {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
        }

        .divider-line::after {
          content: '';
          width: 100%;
          height: 1px;
          background: rgba(255,255,255,0.1);
        }

        .divider-label {
          position: relative;
          padding: 0 16px;
          background: #0d0e0f;
          color: rgba(196, 199, 200, 0.4);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .label-caps {
          display: block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(196, 199, 200, 0.7);
          margin-bottom: 8px;
          padding-left: 4px;
        }

        .forgot-link {
          font-size: 14px;
          color: #4ae176;
          text-decoration: none;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: #6bff8f; }

        .error-box {
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(255, 180, 171, 0.08);
          border: 1px solid rgba(255, 180, 171, 0.2);
          border-radius: 8px;
          color: #ffb4ab;
          font-size: 14px;
        }

        .footer-fixed {
          position: fixed;
          bottom: 0;
          width: 100%;
          padding: 32px 64px;
          margin-top: 16px;
          display: none;
          justify-content: space-between;
          align-items: center;
          z-index: 10;
        }

        @media (min-width: 768px) {
          .footer-fixed { display: flex; }
        }
      `}</style>

      <div className="login-body relative flex flex-col items-center justify-center px-5 md:px-0" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* Atmospheric glows */}
        <div
          ref={glow1Ref}
          className="ambient-glow"
          style={{
            top: '-10%', left: '-10%',
            background: 'radial-gradient(circle, rgba(74, 225, 118, 0.05) 0%, rgba(74, 225, 118, 0) 70%)'
          }}
        />
        <div
          ref={glow2Ref}
          className="ambient-glow"
          style={{
            bottom: '-10%', right: '-10%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 70%)'
          }}
        />

        <main style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10 }}>
          {/* Brand Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', textAlign: 'center' }}>
            <div style={{
              width: '36px', height: '36px', marginBottom: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', fontWeight: '700', color: '#4ae176',
              letterSpacing: '-0.04em'
            }}>
              M
            </div>
            <h1 style={{ fontFamily: 'Geist', fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: '600', color: '#ffffff', letterSpacing: '-0.04em', lineHeight: '1.1', margin: 0, marginBottom: '4px' }}>
              Welcome Back
            </h1>
            <p style={{ fontFamily: 'Geist', fontSize: '14px', color: 'rgba(196, 199, 200, 0.6)', marginTop: '4px' }}>
              Log in to your precision workspace
            </p>
          </div>

          {/* Glass Card */}
          <div ref={cardRef} className="glass-card">
            {/* Google */}
            <button className="btn-google" onClick={handleGoogleSignIn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="divider-text">
              <div className="divider-line" />
              <span className="divider-label">or</span>
            </div>

            {/* Error */}
            {error && <div className="error-box">{error}</div>}

            {/* Form */}
            <form onSubmit={handleEmailSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="label-caps">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="input-field"
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  required
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingLeft: '4px' }}>
                  <span className="label-caps" style={{ marginBottom: 0 }}>Password</span>
                  <Link href="/forgot-password" className="forgot-link">Forgot?</Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Footer link */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Geist', fontSize: '14px', color: 'rgba(196, 199, 200, 0.6)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" style={{ color: '#ffffff', fontWeight: '600', textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationColor: 'rgba(255,255,255,0.1)', transition: 'color 0.2s' }}>
                Sign Up
              </Link>
            </p>
          </div>
        </main>

        {/* Bottom footer */}
        <footer className="footer-fixed">
          <span style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(196,199,200,0.4)' }}>
            © 2025 Munshi AI
          </span>
          <div style={{ display: 'flex', gap: '32px' }}>
            <Link href="/privacy" style={{ fontSize: '14px', color: 'rgba(196,199,200,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}>Privacy Policy</Link>
            <Link href="/terms" style={{ fontSize: '14px', color: 'rgba(196,199,200,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}>Terms of Service</Link>
          </div>
        </footer>
      </div>
    </>
  )
}