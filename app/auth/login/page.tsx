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

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          font-family: 'Geist', 'Inter', sans-serif;
          background: radial-gradient(circle at 50% 50%, #121314 0%, #000000 100%);
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          color: #e3e2e2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 0 20px;
        }

        .ambient-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          transition: transform 0.1s ease-out;
        }

        .login-main {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .brand-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 16px;
          text-align: center;
        }

        .brand-icon {
          width: 32px;
          height: 32px;
          margin-bottom: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #4ae176;
          letter-spacing: -0.04em;
        }

        .brand-title {
          font-size: clamp(20px, 4vw, 28px);
          font-weight: 600;
          color: #ffffff;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin-bottom: 3px;
        }

        .brand-sub {
          font-size: 12px;
          color: rgba(196, 199, 200, 0.6);
        }

        .glass-card {
          width: 100%;
          backdrop-filter: blur(24px);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
          border-radius: 12px;
          padding: 24px 28px;
          transition: border-color 0.5s ease;
        }

        .btn-google {
          width: 100%;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: white;
          color: #2f3131;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-google:hover { background: rgba(255,255,255,0.9); }
        .btn-google:active { transform: scale(0.98); }

        .divider {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 14px 0;
        }
        .divider::before {
          content: '';
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: rgba(255,255,255,0.1);
        }
        .divider-label {
          position: relative;
          padding: 0 12px;
          background: #0d0e0f;
          color: rgba(196, 199, 200, 0.4);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .error-box {
          margin-bottom: 12px;
          padding: 10px 12px;
          background: rgba(255, 180, 171, 0.08);
          border: 1px solid rgba(255, 180, 171, 0.2);
          border-radius: 8px;
          color: #ffb4ab;
          font-size: 13px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          padding-left: 2px;
        }

        .field-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(196, 199, 200, 0.7);
        }

        .forgot-link {
          font-size: 13px;
          color: #4ae176;
          text-decoration: none;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: #6bff8f; }

        .input-field {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px 14px;
          font-family: inherit;
          font-size: 14px;
          color: #e3e2e2;
          transition: all 0.3s ease;
        }
        .input-field::placeholder { color: rgba(196, 199, 200, 0.3); }
        .input-field:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.35);
          background: rgba(255, 255, 255, 0.06);
        }

        .btn-primary {
          width: 100%;
          height: 42px;
          background: #ffffff;
          color: #2f3131;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 4px;
        }
        .btn-primary:hover { background: rgba(255,255,255,0.9); }
        .btn-primary:active { transform: scale(0.99); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .signup-row {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          text-align: center;
          font-size: 13px;
          color: rgba(196, 199, 200, 0.6);
        }

        .signup-link {
          color: #ffffff;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: rgba(255,255,255,0.15);
          transition: color 0.2s;
        }
        .signup-link:hover { color: #4ae176; }
      `}</style>

      <div className="login-root">
        {/* Glows */}
        <div ref={glow1Ref} className="ambient-glow" style={{
          top: '-10%', left: '-10%',
          background: 'radial-gradient(circle, rgba(74, 225, 118, 0.05) 0%, transparent 70%)'
        }} />
        <div ref={glow2Ref} className="ambient-glow" style={{
          bottom: '-10%', right: '-10%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)'
        }} />

        <main className="login-main">
          {/* Brand */}
          <div className="brand-header">
            <div className="brand-icon">M</div>
            <h1 className="brand-title">Welcome Back</h1>
            <p className="brand-sub">Log in to your precision workspace</p>
          </div>

          {/* Card */}
          <div ref={cardRef} className="glass-card">
            <button className="btn-google" onClick={handleGoogleSignIn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="divider">
              <span className="divider-label">or</span>
            </div>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleEmailSignIn} className="form-group">
              <div>
                <div className="label-row">
                  <span className="field-label">Email Address</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <div className="label-row">
                  <span className="field-label">Password</span>
                  <Link href="/auth/forgot-password" className="forgot-link">Forgot?</Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Signup link — inside card */}
            <div className="signup-row">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="signup-link">Sign Up</Link>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}