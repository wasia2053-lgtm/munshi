'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [progressError, setProgressError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { checkOnboardingStatus() }, [])

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: kb } = await supabase.from('knowledge_base').select('id').eq('business_id', user.id).limit(1)
      const { data: settings } = await supabase.from('business_settings').select('onboarding_complete').eq('business_id', user.id).single()
      if ((kb && kb.length > 0) || settings?.onboarding_complete) { router.push('/dashboard'); return }
    } catch (e) { console.error(e) }
  }

  const handleTraining = async () => {
    if (!websiteUrl.trim()) return
    setLoading(true)
    setTrainingProgress(0)
    setProgressError('')
    setProgressLabel('Connecting to website...')

    const steps = [
      { pct: 10, label: 'Connecting to website...' },
      { pct: 25, label: 'Crawling pages (1–5)...' },
      { pct: 50, label: 'Crawling pages (6–12)...' },
      { pct: 75, label: 'Crawling pages (13–20)...' },
      { pct: 90, label: 'Saving to knowledge base...' },
    ]
    let si = 0
    const iv = setInterval(() => {
      if (si < steps.length - 1) { setTrainingProgress(steps[si].pct); setProgressLabel(steps[si].label); si++ }
    }, 2000)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const res = await fetch('/api/train/scrape-website', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl.trim(), businessId: user.id }),
      })
      const result = await res.json()
      clearInterval(iv)
      if (result.success) {
        setTrainingProgress(100)
        setProgressLabel('Training complete!')
        await supabase.from('business_settings').upsert({ business_id: user.id, onboarding_complete: true })
        setTimeout(() => { setStep(2); setTrainingProgress(0); setProgressLabel('') }, 1500)
      } else {
        setProgressError(result.error || 'Training failed')
        setTrainingProgress(0)
      }
    } catch (err: any) {
      clearInterval(iv)
      setProgressError(`Network error: ${err.message}`)
      setTrainingProgress(0)
    } finally { setLoading(false) }
  }

  const handleFinish = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('business_settings').upsert({ business_id: user.id, onboarding_complete: true })
      router.push('/dashboard')
    } catch (e) { console.error(e) }
  }

  const stepLabels = ['Train AI', 'Connect WhatsApp', 'Go Live']

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .ob-root {
          font-family: 'Geist', 'Inter', sans-serif;
          background: #0a0a0b;
          min-height: 100vh;
          color: #e3e2e2;
          display: flex;
          flex-direction: column;
        }
        .mesh-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(at 0% 0%, rgba(74,225,118,0.07) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(255,255,255,0.02) 0px, transparent 50%),
            radial-gradient(at 50% 0%, rgba(74,225,118,0.03) 0px, transparent 50%);
        }
        .ob-header {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          height: 72px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        @media (max-width: 640px) { .ob-header { padding: 0 20px; } }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-icon {
          width: 32px; height: 32px;
          background: #4ae176;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700; color: #000;
        }
        .brand-name {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #fff;
        }
        .save-exit {
          font-size: 13px;
          font-weight: 500;
          color: rgba(196,199,200,0.6);
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
          text-decoration: none;
          display: flex; align-items: center; gap: 6px;
        }
        .save-exit:hover { color: #fff; }
        .ob-main {
          position: relative;
          z-index: 10;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px 60px;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }
        /* Stepper */
        .stepper {
          width: 100%;
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 9999px;
          padding: 6px;
          margin-bottom: 48px;
          gap: 0;
        }
        .step-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 9999px;
          transition: all 0.3s ease;
          white-space: nowrap;
        }
        .step-item.active { background: rgba(255,255,255,0.06); }
        .step-circle {
          width: 26px; height: 26px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700;
          flex-shrink: 0;
          transition: all 0.3s;
        }
        .step-circle.active {
          background: #4ae176;
          color: #000;
          box-shadow: 0 0 16px rgba(74,225,118,0.4);
        }
        .step-circle.done {
          background: rgba(74,225,118,0.15);
          color: #4ae176;
          border: 1px solid rgba(74,225,118,0.3);
        }
        .step-circle.inactive {
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(196,199,200,0.4);
        }
        .step-label {
          font-size: 13px;
          font-weight: 500;
          transition: color 0.3s;
        }
        .step-label.active { color: #fff; }
        .step-label.inactive { color: rgba(196,199,200,0.35); }
        .step-divider {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
          min-width: 16px;
        }
        /* Card */
        .ob-card {
          width: 100%;
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 48px;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 0;
        }
        @media (max-width: 640px) { .ob-card { padding: 32px 24px; } }
        .card-title {
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin-bottom: 12px;
        }
        .card-sub {
          font-size: 15px;
          color: rgba(196,199,200,0.6);
          line-height: 1.6;
          max-width: 480px;
          margin: 0 auto 32px;
        }
        /* Input */
        .input-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #4ae176;
          margin-bottom: 8px;
          text-align: left;
        }
        .url-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px 16px;
          font-family: inherit;
          font-size: 15px;
          color: #e3e2e2;
          transition: all 0.3s;
          margin-bottom: 16px;
        }
        .url-input::placeholder { color: rgba(196,199,200,0.25); }
        .url-input:focus {
          outline: none;
          border-color: rgba(74,225,118,0.4);
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 20px rgba(74,225,118,0.08);
        }
        .url-input:disabled { opacity: 0.5; }
        /* Buttons */
        .btn-primary {
          padding: 14px 28px;
          background: #ffffff;
          color: #000;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover { background: #4ae176; transform: scale(1.03); }
        .btn-primary:active { transform: scale(0.97); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-ghost {
          padding: 14px 24px;
          background: transparent;
          color: rgba(196,199,200,0.6);
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-finish {
          padding: 14px 32px;
          background: #4ae176;
          color: #000;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          display: flex; align-items: center; gap: 8px;
          box-shadow: 0 0 30px rgba(74,225,118,0.25);
        }
        .btn-finish:hover { transform: scale(1.05); box-shadow: 0 0 40px rgba(74,225,118,0.35); }
        .btn-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        /* Progress bar */
        .progress-wrap {
          width: 100%;
          max-width: 480px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 16px 20px;
          margin-top: 20px;
          text-align: left;
        }
        .progress-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .progress-label { font-size: 13px; color: rgba(196,199,200,0.7); }
        .progress-pct { font-size: 13px; font-weight: 700; color: #4ae176; }
        .progress-track {
          height: 4px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4ae176, #00f57a);
          border-radius: 2px;
          transition: width 0.5s ease;
        }
        .error-msg {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(255,180,171,0.08);
          border: 1px solid rgba(255,180,171,0.2);
          border-radius: 8px;
          color: #ffb4ab;
          font-size: 13px;
          text-align: left;
          width: 100%;
          max-width: 480px;
        }
        /* Step 2 info box */
        .info-box {
          width: 100%;
          max-width: 480px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 24px;
          text-align: left;
          margin-bottom: 32px;
        }
        .info-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .info-row:last-child { border-bottom: none; }
        .info-num {
          width: 22px; height: 22px;
          background: rgba(74,225,118,0.1);
          border: 1px solid rgba(74,225,118,0.2);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #4ae176;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .info-text { font-size: 14px; color: rgba(196,199,200,0.8); line-height: 1.5; }
        .code-box {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 8px 12px;
          font-family: 'Geist Mono', monospace;
          font-size: 11px;
          color: #4ae176;
          margin-top: 8px;
          word-break: break-all;
        }
        /* Step 3 success */
        .success-ring {
          position: relative;
          margin-bottom: 32px;
        }
        .success-circle {
          width: 88px; height: 88px;
          background: #4ae176;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 40px rgba(74,225,118,0.5);
          position: relative;
          z-index: 1;
        }
        .success-ping {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(74,225,118,0.2);
          animation: ping 1.5s ease-in-out infinite;
        }
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.5); opacity: 0; }
        }
        /* Bottom nav */
        .ob-footer-nav {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 40px;
          border-top: 1px solid rgba(255,255,255,0.05);
          margin-top: auto;
        }
        @media (max-width: 640px) { .ob-footer-nav { padding: 20px; } }
        /* Input wrap */
        .input-section {
          width: 100%;
          max-width: 480px;
          text-align: left;
          margin-bottom: 8px;
        }
      `}</style>

      <div className="ob-root">
        <div className="mesh-bg" />

        {/* Header */}
        <header className="ob-header">
          <div className="brand">
            <div className="brand-icon">M</div>
            <span className="brand-name">Munshi AI</span>
          </div>
          <Link href="/dashboard" className="save-exit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Save & Exit
          </Link>
        </header>

        {/* Main */}
        <main className="ob-main">
          {/* Stepper */}
          <div className="stepper">
            {stepLabels.map((label, i) => {
              const num = i + 1
              const isActive = step === num
              const isDone = step > num
              return (
                <React.Fragment key={num}>
                  <div className={`step-item ${isActive ? 'active' : ''}`}>
                    <div className={`step-circle ${isActive ? 'active' : isDone ? 'done' : 'inactive'}`}>
                      {isDone ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : num}
                    </div>
                    <span className={`step-label ${isActive ? 'active' : 'inactive'}`}>{label}</span>
                  </div>
                  {i < stepLabels.length - 1 && <div className="step-divider" />}
                </React.Fragment>
              )
            })}
          </div>

          {/* Card */}
          <div className="ob-card">

            {/* STEP 1 — Train */}
            {step === 1 && (
              <>
                <h1 className="card-title">Train Your AI</h1>
                <p className="card-sub">Add your business website — Munshi will crawl it and learn everything automatically.</p>

                <div className="input-section">
                  <label className="input-label">Website URL</label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourbusiness.com"
                    className="url-input"
                    disabled={loading}
                    onKeyDown={e => e.key === 'Enter' && !loading && websiteUrl.trim() && handleTraining()}
                  />
                </div>

                <div className="btn-row">
                  <button className="btn-primary" onClick={handleTraining} disabled={!websiteUrl.trim() || loading}>
                    {loading ? 'Training...' : (
                      <>
                        Start Training
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12H19M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    )}
                  </button>
                  <button className="btn-ghost" onClick={() => setStep(2)} disabled={loading}>
                    Skip for now
                  </button>
                </div>

                {loading && (
                  <div className="progress-wrap">
                    <div className="progress-top">
                      <span className="progress-label">{progressLabel}</span>
                      <span className="progress-pct">{trainingProgress}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${trainingProgress}%` }} />
                    </div>
                  </div>
                )}

                {progressError && <div className="error-msg">❌ {progressError}</div>}
              </>
            )}

            {/* STEP 2 — WhatsApp */}
            {step === 2 && (
              <>
                <h1 className="card-title">Connect WhatsApp</h1>
                <p className="card-sub">Link your WhatsApp Business number to start receiving and replying to customer messages.</p>

                <div className="info-box">
                  <div className="info-row">
                    <div className="info-num">1</div>
                    <p className="info-text">Open <strong style={{ color: '#fff' }}>Meta Business Suite</strong> and go to WhatsApp → API Setup</p>
                  </div>
                  <div className="info-row">
                    <div className="info-num">2</div>
                    <p className="info-text">Verify your WhatsApp Business number</p>
                  </div>
                  <div className="info-row">
                    <div className="info-num">3</div>
                    <p className="info-text">
                      Add this Webhook URL:
                      <div className="code-box">https://munshi-theta.vercel.app/api/webhook</div>
                    </p>
                  </div>
                  <div className="info-row">
                    <div className="info-num">4</div>
                    <p className="info-text">Set Verify Token to: <span style={{ color: '#4ae176', fontFamily: 'monospace' }}>munshi_verify</span></p>
                  </div>
                </div>

                <div className="btn-row">
                  <button className="btn-primary" onClick={() => setStep(3)}>
                    Already Connected
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12H19M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button className="btn-ghost" onClick={() => setStep(3)}>Skip</button>
                </div>
              </>
            )}

            {/* STEP 3 — Live */}
            {step === 3 && (
              <>
                <div className="success-ring">
                  <div className="success-ping" />
                  <div className="success-circle">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                <h1 className="card-title">System is Live.</h1>
                <p className="card-sub">Precision-engineered automation is now active. Your AI assistant is ready to handle customer conversations.</p>

                <button className="btn-finish" onClick={handleFinish}>
                  Access Workspace
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            )}

          </div>
        </main>

        {/* Footer nav */}
        <div className="ob-footer-nav">
          <button
            className="btn-ghost"
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1 || step === 3}
            style={{ visibility: step === 1 || step === 3 ? 'hidden' : 'visible' }}
          >
            ← Previous
          </button>

          <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,199,200,0.25)' }}>
            {step} / {stepLabels.length}
          </span>

          {step < 3 ? (
            <button className="btn-ghost" onClick={() => setStep(step + 1)}>
              Skip →
            </button>
          ) : (
            <span style={{ width: '100px' }} />
          )}
        </div>

      </div>
    </>
  )
}