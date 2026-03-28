'use client'
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState('website')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [manualText, setManualText] = useState('')
  const [user, setUser] = useState<any>(null)
  const [trainingHistory, setTrainingHistory] = useState<any[]>([])
  const [trainingMessage, setTrainingMessage] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) fetchTrainingHistory(user.id)
    }
    getUser()
  }, [])

  const fetchTrainingHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('business_id', userId)
      .order('created_at', { ascending: false })
    if (data && !error) setTrainingHistory(data)
  }

  const handleWebsiteTraining = async () => {
    if (!websiteUrl || !user) return
    setIsTraining(true)
    setTrainingProgress(0)
    setTrainingMessage('')
    try {
      const response = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl, userId: user.id })
      })
      const data = await response.json()
      if (data.success) {
        setTrainingMessage('Training completed successfully!')
        setWebsiteUrl('')
        fetchTrainingHistory(user.id)
      } else {
        setTrainingMessage(`Training failed: ${data.error}`)
      }
    } catch {
      setTrainingMessage('Training failed: Network error')
    } finally {
      setIsTraining(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setUploadedFile(file)
  }

  const removeFile = () => setUploadedFile(null)

  const handleManualTextSubmit = async () => {
    if (!manualText.trim() || !user) return
    try {
      const { data: business } = await supabase
        .from('businesses').select('id').eq('user_id', user.id).single()
      let businessId = business?.id
      if (!businessId) {
        const { data: newBusiness } = await supabase
          .from('businesses').insert({ user_id: user.id, name: 'My Store' }).select('id').single()
        businessId = newBusiness?.id
      }
      if (!businessId) { setTrainingMessage('Failed to create business'); return }
      const { error } = await supabase.from('knowledge_base').insert({
        business_id: businessId, source_type: 'manual',
        content: manualText, chunks_count: 1, created_at: new Date().toISOString()
      })
      if (error) { setTrainingMessage('Failed to save manual text') }
      else {
        setTrainingMessage('Manual text saved successfully!')
        setManualText('')
        fetchTrainingHistory(businessId)
      }
    } catch {
      setTrainingMessage('Failed to save manual text')
    }
  }

  const tabs = [
    { key: 'website', label: '🌐 Website URL' },
    { key: 'pdf',     label: '📄 Upload PDF' },
    { key: 'manual',  label: '✏️ Manual Text' },
  ]

  const steps = [
    { pct: 20,  label: 'Analyzing website structure...' },
    { pct: 40,  label: 'Extracting content and data...' },
    { pct: 60,  label: 'Processing business information...' },
    { pct: 80,  label: 'Training AI model...' },
    { pct: 100, label: 'Finalizing and testing...' },
  ]

  return (
    <DashboardLayout
      title="Bot Training"
      subtitle="Teach your bot about your business and services"
    >
      <style>{`
        /* ── TABS ── */
        .train-tabs {
          display: flex;
          gap: 4px;
          background: #0D2420;
          padding: 4px;
          border-radius: 14px;
          margin-bottom: 24px;
          width: fit-content;
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .train-tabs::-webkit-scrollbar { display: none; }
        .tab-btn {
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
          background: transparent;
          color: #C4A882;
        }
        .tab-btn:hover { color: #F7E7CE; }
        .tab-btn.active {
          background: #1A3D35;
          color: #D4A853;
          border: 1px solid rgba(212,168,83,0.2);
        }

        /* ── CARD ── */
        .train-card {
          background: linear-gradient(135deg, #1A3D35, #142E28);
          border: 1px solid #2A4A42;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 20px;
        }

        /* ── INFO BOX ── */
        .info-box {
          padding: 14px 16px;
          background: #0D2420;
          border-left: 3px solid #D4A853;
          border-radius: 0 10px 10px 0;
          margin-bottom: 20px;
          font-size: 13px;
          color: #C4A882;
          line-height: 1.6;
        }

        /* ── URL INPUT ROW ── */
        .url-row {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }
        .url-input {
          flex: 1;
          min-width: 0;
          padding: 12px 14px;
          background: #0D2420;
          border: 1px solid #2A4A42;
          border-radius: 10px;
          color: #F7E7CE;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border 0.2s;
        }
        .url-input::placeholder { color: #8A7560; }
        .url-input:focus { border-color: #D4A853; box-shadow: 0 0 0 3px rgba(212,168,83,0.1); }
        .btn-train {
          padding: 12px 20px;
          background: linear-gradient(135deg, #D4A853, #C4983F);
          color: #0D2420;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
          flex-shrink: 0;
        }
        .btn-train:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(212,168,83,0.3); }
        .btn-train:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── PROGRESS ── */
        .progress-box {
          background: #0D2420;
          border: 1px solid #2A4A42;
          border-radius: 14px;
          padding: 20px;
        }
        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #C4A882;
          margin-bottom: 8px;
        }
        .progress-bar-bg {
          height: 6px;
          background: #2A4A42;
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #D4A853, #F0C96A);
          border-radius: 999px;
          transition: width 0.5s ease;
        }
        .progress-step {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #C4A882;
          padding: 4px 0;
        }
        .step-dot {
          width: 20px; height: 20px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
        }
        .step-dot.done { background: rgba(76,175,130,0.15); border: 1px solid #4CAF82; color: #4CAF82; }
        .step-dot.active { background: rgba(212,168,83,0.15); border: 1px solid #D4A853; color: #D4A853; }
        .step-dot.pending { background: rgba(42,74,66,0.5); border: 1px solid #2A4A42; color: #8A7560; }

        /* ── PDF UPLOAD ── */
        .upload-zone {
          border: 2px dashed #2A4A42;
          border-radius: 14px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          background: #0D2420;
          transition: all 0.2s;
          margin-bottom: 14px;
        }
        .upload-zone:hover { border-color: rgba(212,168,83,0.4); background: rgba(212,168,83,0.02); }
        .upload-icon { font-size: 36px; margin-bottom: 10px; opacity: 0.7; }
        .upload-title { font-size: 15px; font-weight: 500; color: #F7E7CE; margin-bottom: 6px; }
        .upload-sub { font-size: 13px; color: #8A7560; }
        .file-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: #0D2420;
          border: 1px solid #2A4A42;
          border-radius: 10px;
          margin-bottom: 14px;
        }
        .file-name { flex: 1; font-size: 13px; color: #F7E7CE; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .file-remove { color: #8A7560; cursor: pointer; font-size: 20px; line-height: 1; transition: color 0.2s; flex-shrink: 0; }
        .file-remove:hover { color: #E05C5C; }

        /* ── TEXTAREA ── */
        .train-textarea {
          width: 100%;
          padding: 14px;
          background: #0D2420;
          border: 1px solid #2A4A42;
          border-radius: 10px;
          color: #F7E7CE;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          line-height: 1.6;
          resize: vertical;
          min-height: 160px;
          outline: none;
          transition: border 0.2s;
        }
        .train-textarea::placeholder { color: #8A7560; }
        .train-textarea:focus { border-color: #D4A853; box-shadow: 0 0 0 3px rgba(212,168,83,0.1); }
        .char-count { font-size: 12px; color: #8A7560; text-align: right; margin-top: 6px; }

        /* ── FULL WIDTH BTN ── */
        .btn-full {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #D4A853, #C4983F);
          color: #0D2420;
          font-size: 15px;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          margin-top: 4px;
        }
        .btn-full:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(212,168,83,0.3); }
        .btn-full:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── MESSAGE ── */
        .train-msg {
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .train-msg.success { background: rgba(76,175,130,0.1); color: #4CAF82; border: 1px solid rgba(76,175,130,0.2); }
        .train-msg.error { background: rgba(224,92,92,0.1); color: #E05C5C; border: 1px solid rgba(224,92,92,0.2); }

        /* ── HISTORY TABLE ── */
        .history-card {
          background: linear-gradient(135deg, #1A3D35, #142E28);
          border: 1px solid #2A4A42;
          border-radius: 20px;
          padding: 24px;
        }
        .history-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 700;
          color: #F7E7CE;
          margin-bottom: 18px;
        }
        .history-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .history-table { width: 100%; min-width: 460px; border-collapse: collapse; }
        .history-table th {
          text-align: left;
          padding: 10px 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #8A7560;
          border-bottom: 1px solid #2A4A42;
        }
        .history-table td {
          padding: 12px;
          font-size: 13px;
          color: #C4A882;
          border-bottom: 1px solid rgba(42,74,66,0.4);
          vertical-align: middle;
        }
        .history-table tr:last-child td { border-bottom: none; }
        .history-table tr:hover td { background: rgba(247,231,206,0.02); }
        .source-text { color: #F7E7CE; font-weight: 500; }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 500;
          background: rgba(76,175,130,0.1);
          color: #4CAF82;
          border: 1px solid rgba(76,175,130,0.2);
        }
        .status-dot-green {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4CAF82;
          flex-shrink: 0;
        }
        .empty-row td {
          padding: 40px 12px;
          text-align: center;
          color: #8A7560;
          font-size: 13px;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 640px) {
          .train-tabs { width: 100%; }
          .tab-btn { padding: 8px 13px; font-size: 12px; }
          .train-card { padding: 16px; }
          .history-card { padding: 16px; }
          .url-row { flex-direction: column; }
          .btn-train { width: 100%; }
          .upload-zone { padding: 28px 16px; }
        }
      `}</style>

      {/* ── TABS ── */}
      <div className="train-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── WEBSITE TAB ── */}
      {activeTab === 'website' && (
        <div className="train-card">
          <div className="info-box">
            Enter your website URL and our AI will crawl and learn from your product pages,
            services, and business information to provide accurate responses to customer queries.
          </div>

          <div className="url-row">
            <input
              type="url"
              className="url-input"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
            />
            <button
              className="btn-train"
              onClick={handleWebsiteTraining}
              disabled={!websiteUrl || isTraining}
            >
              {isTraining ? '⏳ Training...' : '🚀 Train Bot'}
            </button>
          </div>

          {isTraining && (
            <div className="progress-box">
              <div className="progress-header">
                <span>Training Progress</span>
                <span>{trainingProgress}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${trainingProgress}%` }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {steps.map((s, i) => {
                  const done = trainingProgress >= s.pct
                  const prev = i === 0 ? 0 : steps[i - 1].pct
                  const active = !done && trainingProgress > prev
                  return (
                    <div className="progress-step" key={i}>
                      <div className={`step-dot ${done ? 'done' : active ? 'active' : 'pending'}`}>
                        {done ? '✓' : active ? '⟳' : ''}
                      </div>
                      <span>{s.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PDF TAB ── */}
      {activeTab === 'pdf' && (
        <div className="train-card">
          <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" id="pdf-upload" />
          <label htmlFor="pdf-upload">
            <div className="upload-zone">
              <div className="upload-icon">📄</div>
              <div className="upload-title">Upload PDF Document</div>
              <div className="upload-sub">Drag and drop your PDF here, or click to browse</div>
            </div>
          </label>

          {uploadedFile && (
            <div className="file-preview">
              <span style={{ fontSize: 22 }}>📄</span>
              <span className="file-name">{uploadedFile.name}</span>
              <span className="file-remove" onClick={removeFile}>×</span>
            </div>
          )}

          <button className="btn-full" disabled={!uploadedFile}>
            Train from PDF
          </button>
        </div>
      )}

      {/* ── MANUAL TAB ── */}
      {activeTab === 'manual' && (
        <div className="train-card">
          <label style={{ display: 'block', fontSize: 13, color: '#C4A882', marginBottom: 8, fontWeight: 500 }}>
            Business Information
          </label>
          <textarea
            className="train-textarea"
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            placeholder="Enter information about your business, products, services, policies, etc. The more detail you provide, the better your bot will assist customers."
            rows={8}
          />
          <div className="char-count">{manualText.length} characters</div>
          <button className="btn-full" onClick={handleManualTextSubmit} disabled={!manualText.trim()}>
            Train from Text
          </button>
        </div>
      )}

      {/* ── TRAINING HISTORY ── */}
      <div className="history-card">
        <div className="history-title">Training History</div>

        {trainingMessage && (
          <div className={`train-msg ${trainingMessage.includes('successfully') ? 'success' : 'error'}`}>
            {trainingMessage.includes('successfully') ? '✅' : '❌'} {trainingMessage}
          </div>
        )}

        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {trainingHistory.length > 0 ? trainingHistory.map((item, i) => (
                <tr key={i}>
                  <td>
                    <span className="source-text">
                      {item.source_type === 'website' ? item.source_url :
                       item.source_type === 'manual' ? 'Manual Text' : 'Unknown'}
                    </span>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{item.source_type}</td>
                  <td>
                    <span className="status-pill">
                      <span className="status-dot-green" />
                      Completed
                    </span>
                  </td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr className="empty-row">
                  <td colSpan={4}>
                    No training data yet — start by training your bot above! 🚀
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}