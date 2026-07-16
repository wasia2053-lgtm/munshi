'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function VerifyEmailPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleResendEmail = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        setError('No email found. Please login again.')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Verification email sent successfully!')
      }
    } catch (err) {
      setError('Failed to resend email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#102C26] flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        {/* Card */}
        <div className="bg-[#1A3D35] border border-[#2A4A42] rounded-2xl p-5 sm:p-6 md:p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <img src="/branding/logo.svg" alt="Munshi" style={{ display: 'block', height: '34px', width: 'auto' }} />
          </div>

          {/* Icon */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">✉️</div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#F7E7CE] mb-3">
              Please Verify Your Email
            </h1>
            <p className="text-sm text-[#8A7560]">
              Check your inbox and click the verification link to activate your account.
            </p>
          </div>

          {/* Success Message */}
          {message && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-[rgba(42,157,143,0.1)] border border-[rgba(42,157,143,0.25)] rounded-lg text-[#2A9D8F] text-xs sm:text-sm">
              {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-[rgba(224,92,92,0.1)] border border-[rgba(224,92,92,0.25)] rounded-lg text-[#E05C5C] text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={handleResendEmail}
              disabled={loading}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-[#D4A853] to-[#C4983F] text-[#0D2420] text-sm sm:text-base font-semibold rounded-lg hover:transform hover:translateY-[-2px] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:transform active:translateY-[0px]"
            >
              {loading ? 'Sending...' : 'Resend Email'}
            </button>

            <button
              onClick={() => router.push('/login')}
              className="w-full py-2.5 sm:py-3 bg-transparent border border-[#2A4A42] text-[#F7E7CE] text-sm sm:text-base font-semibold rounded-lg hover:bg-[#2A4A42] transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
