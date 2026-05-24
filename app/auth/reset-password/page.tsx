'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoCompact } from '@/components/logos'
import { Suspense } from 'react'

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const handleReset = async () => {
    if (!newPassword.trim()) {
      setError('New password zaroori hai')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords match nahi kar rahe')
      return
    }

    if (newPassword.length < 6) {
      setError('Password kam az kam 6 characters ka hona chahiye')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (err: any) {
      setError('Koi masla ho gaya. Dobara koshish karein.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      router.push('/forgot-password')
    }
  }, [searchParams, router])

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
            New Password Set Karein
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#8A7560',
            margin: 0
          }}>
            Apna naya password enter karein
          </p>
        </div>

        {!success ? (
          <>
            {/* New Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#C4A882',
                marginBottom: '8px'
              }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
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

            {/* Confirm Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#C4A882',
                marginBottom: '8px'
              }}>
                Password Confirm Karein
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
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
              {loading ? 'Processing...' : 'Password Reset Karein'}
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
              Password Successfully Reset!
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#8A7560',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Apna naya password set ho gaya hai
            </p>
            <p style={{
              fontSize: '14px',
              color: '#8A7560',
              opacity: '0.8'
            }}>
              Dashboard mein redirect ho raha hain...
            </p>
          </div>
        )}

        {/* Back to Login */}
        {!success && (
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
              Login Karein
            </a>
          </div>
        )}
      </div>

      {/* SEO Title */}
      <title>Password Reset - Munshi</title>
    </div>
  )
} 

function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

export default ResetPasswordPage;

