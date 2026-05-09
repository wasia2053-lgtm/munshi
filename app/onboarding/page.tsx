'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoCompact } from '@/components/logos'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user has any training data
      const { data: knowledgeData } = await supabase
        .from('knowledge_base')
        .select('id')
        .eq('business_id', user.id)
        .limit(1)

      // Check if onboarding is already completed
      const { data: settings } = await supabase
        .from('business_settings')
        .select('onboarding_complete')
        .eq('business_id', user.id)
        .single()

      if (knowledgeData && knowledgeData.length > 0 || settings?.onboarding_complete) {
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Onboarding check error:', error)
    }
  }

  const handleTraining = async () => {
    if (!websiteUrl.trim()) return
    
    setLoading(true)
    setTrainingProgress(0)
    setProgressLabel('Starting training...')

    const steps = [
      { pct: 10, label: 'Connecting to website...' },
      { pct: 25, label: 'Crawling pages (1-5)...' },
      { pct: 50, label: 'Crawling pages (6-12)...' },
      { pct: 75, label: 'Crawling pages (13-20)...' },
      { pct: 90, label: 'Saving to knowledge base...' },
      { pct: 100, label: '✅ Training complete!' },
    ]

    // Fake progress while API runs
    let stepIndex = 0
    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        setTrainingProgress(steps[stepIndex].pct)
        setProgressLabel(steps[stepIndex].label)
        stepIndex++
      }
    }, 2000)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const res = await fetch('/api/train/scrape-website', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl.trim(), businessId: user.id }),
      })
      const result = await res.json()
      clearInterval(progressInterval)

      if (result.success) {
        setTrainingProgress(100)
        setProgressLabel('Training complete!')
        
        // Mark onboarding as complete
        await supabase
          .from('business_settings')
          .upsert({ 
            business_id: user.id, 
            onboarding_complete: true 
          })
        
        setTimeout(() => {
          setStep(2)
          setTrainingProgress(0)
          setProgressLabel('')
        }, 2000)
      } else {
        setProgressLabel(`❌ ${result.error || 'Training failed'}`)
        setTrainingProgress(0)
      }
    } catch (err: any) {
      clearInterval(progressInterval)
      setProgressLabel(`❌ Network error: ${err.message}`)
      setTrainingProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleFinish = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      await supabase
        .from('business_settings')
        .upsert({ 
          business_id: user.id, 
          onboarding_complete: true 
        })
      router.push('/dashboard')
    } catch (error) {
      console.error('Finish onboarding error:', error)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#102C26',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      
      {/* Center Card */}
      <div style={{
        backgroundColor: '#0D2420',
        border: '1px solid #2A4A42',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <LogoCompact />
        </div>

        {/* Step Indicator */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '8px', 
          marginBottom: '30px' 
        }}>
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: step >= num ? '#D4A853' : '#2A4A42',
                transition: 'background-color 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Step 1 - Training */}
        {step === 1 && (
          <div>
            <h2 style={{ 
              color: '#F7E7CE', 
              fontSize: '24px', 
              fontWeight: '700',
              marginBottom: '12px',
              textAlign: 'center',
              fontFamily: "'Cormorant Garamond', serif"
            }}>
              Train Your Bot
            </h2>
            
            <p style={{ 
              color: '#8A7560', 
              fontSize: '14px',
              marginBottom: '24px',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Apne business ki website add karo
            </p>
            
            <p style={{ 
              color: '#C4A882', 
              fontSize: '13px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Bot automatically seekh jayega
            </p>

            <div style={{ marginBottom: '20px' }}>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourbusiness.com"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#1A3D35',
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

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleTraining}
                disabled={!websiteUrl.trim() || loading}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  backgroundColor: loading ? '#8A7560' : '#D4A853',
                  color: '#102C26',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Training...' : 'Train & Continue'}
              </button>
              
              <button
                onClick={handleSkip}
                disabled={loading}
                style={{
                  padding: '14px 20px',
                  backgroundColor: 'transparent',
                  color: '#8A7560',
                  border: '1px solid #2A4A42',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Baad mein karoon
              </button>
            </div>

            {/* Progress */}
            {loading && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#1A3D35',
                border: '1px solid #2A4A42',
                borderRadius: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: '#C4A882', fontSize: '12px' }}>
                    {progressLabel || 'Starting...'}
                  </span>
                  <span style={{ color: '#D4A853', fontSize: '12px', fontWeight: '600' }}>
                    {trainingProgress}%
                  </span>
                </div>
                <div style={{
                  height: '4px',
                  backgroundColor: '#2A4A42',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${trainingProgress}%`,
                    backgroundColor: '#D4A853',
                    transition: 'width 0.5s ease',
                    borderRadius: '2px'
                  }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 - WhatsApp Connection */}
        {step === 2 && (
          <div>
            <h2 style={{ 
              color: '#F7E7CE', 
              fontSize: '24px', 
              fontWeight: '700',
              marginBottom: '12px',
              textAlign: 'center',
              fontFamily: "'Cormorant Garamond', serif"
            }}>
              Connect WhatsApp
            </h2>
            
            <div style={{
              backgroundColor: '#1A3D35',
              border: '1px solid #2A4A42',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ color: '#C4A882', fontSize: '14px', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#F7E7CE' }}>1.</strong> Meta Business Suite kholo
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#F7E7CE' }}>2.</strong> WhatsApp {'>'} API Setup
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#F7E7CE' }}>3.</strong> Apna number verify karo
                </div>
                <div>
                  <strong style={{ color: '#F7E7CE' }}>4.</strong> Webhook URL copy karo:
                  <div style={{
                    backgroundColor: '#0D2420',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    marginTop: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    wordBreak: 'break-all'
                  }}>
                    https://your-ngrok-url.ngrok.io/webhook
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(3)}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  backgroundColor: '#D4A853',
                  color: '#102C26',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Already Connected
              </button>
              
              <button
                onClick={handleSkip}
                style={{
                  padding: '14px 20px',
                  backgroundColor: 'transparent',
                  color: '#8A7560',
                  border: '1px solid #2A4A42',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Step 3 - Completion */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              🎉
            </div>
            
            <h2 style={{ 
              color: '#F7E7CE', 
              fontSize: '24px', 
              fontWeight: '700',
              marginBottom: '12px',
              fontFamily: "'Cormorant Garamond', serif"
            }}>
              Munshi Ready Hai!
            </h2>
            
            <p style={{ 
              color: '#8A7560', 
              fontSize: '16px',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Aapka bot live hai WhatsApp pe
            </p>

            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#4CAF82',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#102C26"/>
              </svg>
            </div>

            <button
              onClick={handleFinish}
              style={{
                padding: '16px 32px',
                backgroundColor: '#D4A853',
                color: '#102C26',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Dashboard Kholo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
