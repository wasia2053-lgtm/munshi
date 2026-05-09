'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoCompact } from '@/components/logos'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Email zaroori hai')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/reset-password'
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setError('Koi masla ho gaya. Dobara koshish karein.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#102C26',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#0D2420',
        border: '1px solid #2A4A42',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <LogoCompact />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#F7E7CE',
            marginBottom: '8px',
            fontFamily: "'Cormorant Garamond', serif"
          }}>
            Password Reset
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#8A7560',
            margin: 0
          }}>
            Apna email address enter karein
          </p>
        </div>

        {/* Form */}
        {!success ? (
          <>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#C4A882',
                marginBottom: '8px'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#102C26',
                  border: '1px solid #2A4A42',
                  borderRadius: '8px',
                  color: '#F7E7CE',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#D4A853'}
                onBlur={(e) => e.target.style.borderColor = '#2A4A42'}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #EF4444',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <p style={{
                  margin: 0,
                  color: '#EF4444',
                  fontSize: '14px'
                }}>
                  {error}
                </p>
              </div>
            )}

            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 24px',
                backgroundColor: loading ? '#8A7560' : '#D4A853',
                color: '#102C26',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'DM Sans', sans-serif"
              }}
            >
              {loading ? 'Bhej raha hain...' : 'Reset Password'}
            </button>
          </>
        ) : (
          /* Success State */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#4CAF82',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#102C26"/>
              </svg>
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#F7E7CE',
              marginBottom: '12px'
            }}>
              Email bhej di!
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#8A7560',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Apna inbox check karein aur reset link par click karein
            </p>
          </div>
        )}

        {/* Back to Login */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <a
            href="/login"
            style={{
              color: '#D4A853',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F7E7CE'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#D4A853'}
          >
            Wapas Login
          </a>
        </div>
      </div>

      {/* SEO Title */}
      <title>Password Reset - Munshi</title>
    </div>
  )
}
