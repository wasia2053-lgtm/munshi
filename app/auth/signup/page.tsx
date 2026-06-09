'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const glow1Ref = useRef<HTMLDivElement>(null)
  const glow2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      if (glow1Ref.current) glow1Ref.current.style.transform = `translate(${x * 20}px, ${y * 20}px)`
      if (glow2Ref.current) glow2Ref.current.style.transform = `translate(${x * -20}px, ${y * -20}px)`
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) console.error('Google sign up error:', error)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      })

      if (error) {
        setError(error.message)
      } else {
        setUserEmail(email)
        setEmailSent(true)
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
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@100;300;400;500;600;700;800;900&display=swap');

        .signup-body {
          font-family: 'Geist', sans-serif;
          background-color: #000000;
          color: #e3e2e2;
          min-height: 100vh;
        }

        .obsidian-glow {
          position: fixed;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          z-index: 0;
          filter: blur(60px);
          pointer-events: none;
        }

        .glass-card {
          background: rgba(18, 19, 20, 0.05);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          width: 100%;
          max-width: 480px;
          padding: 24px;
        }

        @media (min-width: 768px) {
          .glass-card { padding: 28px; }
        }

        .glass-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%);
          pointer-events: none;
          z-index: -1;
        }

        .input-glass {
          width: 100%;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 10px 16px;
          padding-left: 48px;
          font-family: 'Geist', sans-serif;
          font-size: 16px;
          color: #e3e2e2;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .input-glass::placeholder { color: rgba(196, 199, 200, 0.3); }

        .input-glass:focus {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.4);
          outline: none;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
        }

        .input-glass:focus + .input-icon,
        .input-wrapper:focus-within .input-icon {
          color: #ffffff;
        }

        .input-no-icon {
          width: 100%;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 10px 16px;
          font-family: 'Geist', sans-serif;
          font-size: 16px;
          color: #e3e2e2;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .input-no-icon::placeholder { color: rgba(196, 199, 200, 0.3); }
        .input-no-icon:focus {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.4);
          outline: none;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(196, 199, 200, 0.4);
          transition: color 0.3s;
          font-size: 18px;
          pointer-events: none;
        }

        .label-caps {
          display: block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(196, 199, 200, 0.8);
          margin-bottom: 8px;
          margin-left: 4px;
        }

        .btn-google {
          width: 100%;
          height: 44px; padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          font-family: 'Geist', sans-serif;
          font-size: 16px;
          color: #e3e2e2;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-google:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.2);
        }

        .btn-primary {
          width: 100%;
          height: 44px; padding: 12px;
          background: #ffffff;
          color: #2f3131;
          font-family: 'Geist', sans-serif;
          font-size: 16px;
          font-weight: 700;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          box-shadow: 0 0 20px rgba(255,255,255,0.1);
          transform: translateY(-1px);
        }

        .btn-primary:active { transform: scale(0.98); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 20px 0;
        }

        .divider-line { height: 1px; flex: 1; background: rgba(255,255,255,0.05); }

        .divider-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(196, 199, 200, 0.4);
        }

        .footer-fixed {
          margin-top: 16px;
        }

        .error-box {
          margin-bottom: 24px;
          padding: 12px 16px;
          background: rgba(255, 180, 171, 0.08);
          border: 1px solid rgba(255, 180, 171, 0.2);
          border-radius: 8px;
          color: #ffb4ab;
          font-size: 14px;
        }

        .visibility-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(196,199,200,0.4);
          cursor: pointer;
          font-size: 16px;
          transition: color 0.2s;
          padding: 0;
          line-height: 1;
        }

        .visibility-btn:hover { color: #e3e2e2; }

        .bg-binary {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.03;
          overflow: hidden;
          z-index: 0;
        }

        .binary-text {
          position: absolute;
          font-family: 'Geist', monospace;
          font-size: 120px;
          white-space: nowrap;
          user-select: none;
          color: #e3e2e2;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          background: rgba(74, 225, 118, 0.1);
          border: 1px solid rgba(74, 225, 118, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
      `}</style>

      <div className="signup-body relative flex flex-col items-center justify-center min-h-screen p-5 md:p-6">
        {/* Atmospheric glows */}
        <div
          ref={glow1Ref}
          className="obsidian-glow"
          style={{
            top: '-200px', left: '-200px',
            background: 'radial-gradient(circle, rgba(74, 225, 118, 0.03) 0%, rgba(0,0,0,0) 70%)'
          }}
        />
        <div
          ref={glow2Ref}
          className="obsidian-glow"
          style={{
            bottom: '-200px', right: '-200px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0) 70%)'
          }}
        />

        {/* Binary bg decoration */}
        <div className="bg-binary">
          <div className="binary-text" style={{ top: '25%', right: '-48px', transform: 'rotate(90deg)' }}>
            01011001 01010111 01010011 01001000 01001001
          </div>
          <div className="binary-text" style={{ bottom: '25%', left: '-48px', transform: 'rotate(-90deg)' }}>
            PRECISION AUTOMATION OBSIDIAN
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '64px', height: '64px', marginBottom: '24px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: '700', color: '#4ae176',
            letterSpacing: '-0.04em'
          }}>
            M
          </div>
          <h1 style={{ fontFamily: 'Geist', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '600', color: '#ffffff', letterSpacing: '-0.04em', lineHeight: '1.1', margin: '0 0 8px', textAlign: 'center' }}>
            Start your AI journey
          </h1>
          <p style={{ fontFamily: 'Geist', fontSize: '16px', color: 'rgba(196,199,200,0.7)', textAlign: 'center', maxWidth: '400px' }}>
            Automate your business flows with silent precision.
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass-card" style={{ position: 'relative', zIndex: 1 }}>
          {emailSent ? (
            /* Email sent state */
            <div style={{ textAlign: 'center' }}>
              <div className="success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 6L12 13L2 6" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 style={{ fontFamily: 'Geist', fontSize: '24px', fontWeight: '500', color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '12px' }}>
                Check your email
              </h2>
              <p style={{ fontFamily: 'Geist', fontSize: '14px', color: 'rgba(196,199,200,0.6)', marginBottom: '8px' }}>
                We sent a verification link to
              </p>
              <p style={{ fontFamily: 'Geist', fontSize: '14px', color: '#4ae176', fontWeight: '500', marginBottom: '24px' }}>
                {userEmail}
              </p>
              <p style={{ fontFamily: 'Geist', fontSize: '12px', color: 'rgba(196,199,200,0.4)', marginBottom: '32px' }}>
                Click the link to activate your account. Check spam if not received.
              </p>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '32px' }} />
              <button
                onClick={() => window.location.href = '/auth/login'}
                className="btn-primary"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <>
              {/* Google */}
              <button className="btn-google" onClick={handleGoogleSignUp}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign Up with Google
              </button>

              {/* Divider */}
              <div className="divider">
                <div className="divider-line" />
                <span className="divider-label">or</span>
                <div className="divider-line" />
              </div>

              {/* Error */}
              {error && <div className="error-box">{error}</div>}

              {/* Form */}
              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Name */}
                <div>
                  <label className="label-caps">Full Name</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="John Doe"
                      className="input-glass"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="label-caps">Business Email</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="john@company.ai"
                      className="input-glass"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="label-caps">Password</label>
                  <div style={{ position: 'relative' }}>
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-no-icon"
                      required
                      minLength={6}
                    />
                    <button type="button" className="visibility-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="label-caps">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-no-icon"
                      required
                      minLength={6}
                    />
                    <button type="button" className="visibility-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              {/* Terms */}
              <p style={{ marginTop: '32px', textAlign: 'center', fontFamily: 'Geist', fontSize: '12px', color: 'rgba(196,199,200,0.5)', padding: '0 16px' }}>
                By signing up, you agree to our{' '}
                <Link href="/terms" style={{ color: 'rgba(196,199,200,0.8)', textDecoration: 'underline' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" style={{ color: 'rgba(196,199,200,0.8)', textDecoration: 'underline' }}>Privacy Policy</Link>.
              </p>
            </>
          )}
        </div>

        {/* Footer link */}
        <footer style={{ marginTop: '48px', position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: 'Geist', fontSize: '16px', color: 'rgba(196,199,200,0.6)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#ffffff', fontWeight: '500', textDecoration: 'underline', transition: 'color 0.2s' }}>
              Log In
            </Link>
          </p>
        </footer>
      </div>
    </>
  )
}