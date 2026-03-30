'use client'
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'

export default function TrainingPage() {
  const [businessId, setBusinessId] = useState('')
  const [trainingHistory, setTrainingHistory] = useState<any[]>([])
  const [stats, setStats] = useState({ totalTrainings: 0, websiteCount: 0, pdfCount: 0, textCount: 0, totalChunks: 0 })
  const [activeTab, setActiveTab] = useState<'website' | 'pdf' | 'text'>('website')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Website tab state
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')

  // PDF tab state
  const [uploading, setUploading] = useState(false)

  // Text tab state
  const [textInput, setTextInput] = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [textSubmitting, setTextSubmitting] = useState(false)

  useEffect(() => {
    const getBusinessId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // Get actual business ID from businesses table
        if (session?.user) {
          const { data: business } = await supabase
            .from('businesses')
            .select('id')
            .eq('user_id', session.user.id)
            .single()
          
          if (business?.id) {
            setBusinessId(business.id)
          } else {
            // fallback
            setBusinessId('00000000-0000-0000-0000-000000000001')
          }
        } else {
          setBusinessId('00000000-0000-0000-0000-000000000001')
        }
      } catch {
        setBusinessId('00000000-0000-0000-0000-000000000001')
      } finally {
        setLoading(false)
      }
    }
    getBusinessId()
  }, [])

  useEffect(() => {
    if (businessId) fetchHistory()
  }, [businessId])

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (data && !error) {
        // Group by source_url to avoid duplicates (chunks)
        const seen = new Set()
        const unique = data.filter((item: any) => {
          const key = `${item.source_type}:${item.source_url}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        setTrainingHistory(unique)

        // Stats
        const websiteCount = unique.filter((i: any) => i.source_type === 'website').length
        const pdfCount = unique.filter((i: any) => i.source_type === 'pdf').length
        const textCount = unique.filter((i: any) => i.source_type === 'manual' || i.source_type === 'text').length
        setStats({
          totalTrainings: unique.length,
          websiteCount,
          pdfCount,
          textCount,
          totalChunks: data.length,
        })
      }
    } catch (err) {
      console.error('fetchHistory error:', err)
    }
  }

  // ── Website Training ──
  const handleWebsiteTraining = async () => {
    if (!websiteUrl.trim()) return
    setIsTraining(true)
    setTrainingProgress(0)
    setMessage(null)

    const steps = [
      { pct: 15, label: 'Connecting to website...' },
      { pct: 35, label: 'Fetching page content...' },
      { pct: 60, label: 'Extracting text data...' },
      { pct: 80, label: 'Saving to knowledge base...' },
      { pct: 100, label: 'Training complete!' },
    ]

    // Fake progress while API runs
    let stepIndex = 0
    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        setTrainingProgress(steps[stepIndex].pct)
        setProgressLabel(steps[stepIndex].label)
        stepIndex++
      }
    }, 800)

    try {
      const res = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl.trim(), businessId }),
      })
      const result = await res.json()
      clearInterval(progressInterval)

      if (result.success) {
        setTrainingProgress(100)
        setProgressLabel('Training complete!')
        setMessage({ type: 'success', text: `✅ Website trained! ${result.chunks} chunks saved from ${websiteUrl}` })
        setWebsiteUrl('')
        await fetchHistory()
        setTimeout(() => { setTrainingProgress(0); setProgressLabel('') }, 2000)
      } else {
        setMessage({ type: 'error', text: `❌ ${result.error || 'Training failed'}` })
        setTrainingProgress(0)
        setProgressLabel('')
      }
    } catch (err: any) {
      clearInterval(progressInterval)
      setMessage({ type: 'error', text: `❌ Network error: ${err.message}` })
      setTrainingProgress(0)
      setProgressLabel('')
    } finally {
      setIsTraining(false)
    }
  }

  // ── PDF Upload ──
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessId', businessId)
      const res = await fetch('/api/train/upload-pdf', { method: 'POST', body: formData })
      const result = await res.json()
      if (result.success) {
        setMessage({ type: 'success', text: `✅ PDF uploaded! ${result.chunks} chunks created` })
        await fetchHistory()
        e.target.value = ''
      } else {
        setMessage({ type: 'error', text: `❌ ${result.error || 'Upload failed'}` })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `❌ Error: ${err.message}` })
    } finally {
      setUploading(false)
    }
  }

  // ── Manual Text ──
  const handleTextSubmit = async () => {
    if (!textInput.trim()) { setMessage({ type: 'error', text: '❌ Please enter text' }); return }
    setTextSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/train/add-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, text: textInput, title: textTitle || 'Manual Entry' }),
      })
      const result = await res.json()
      if (result.success) {
        setMessage({ type: 'success', text: `✅ Text added! ${result.chunks} chunks created` })
        setTextInput('')
        setTextTitle('')
        await fetchHistory()
      } else {
        setMessage({ type: 'error', text: `❌ ${result.error || 'Failed to add'}` })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `❌ Error: ${err.message}` })
    } finally {
      setTextSubmitting(false)
    }
  }

  // ── Delete ──
  const handleDelete = async (sourceType: string, sourceUrl: string) => {
    if (!confirm('Delete this training data?')) return
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('business_id', businessId)
        .eq('source_type', sourceType)
        .eq('source_url', sourceUrl)

      if (!error) {
        setMessage({ type: 'success', text: '✅ Deleted!' })
        await fetchHistory()
      } else {
        setMessage({ type: 'error', text: `❌ Delete failed` })
      }
    } catch {
      setMessage({ type: 'error', text: `❌ Error deleting` })
    }
  }

  const tabs = [
    { key: 'website', label: '🌐 Website URL' },
    { key: 'pdf',     label: '📄 Upload PDF' },
    { key: 'text',    label: '✏️ Manual Text' },
  ]

  const progressSteps = [
    { label: 'Connecting to website...', threshold: 15 },
    { label: 'Fetching page content...', threshold: 35 },
    { label: 'Extracting text data...', threshold: 60 },
    { label: 'Saving to knowledge base...', threshold: 80 },
    { label: 'Training complete!', threshold: 100 },
  ]

  if (loading) {
    return (
      <DashboardLayout title="Train Bot" subtitle="Upload documents or add text to train your AI bot">
        <div style={{ color: '#F7E7CE' }}>Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Train Bot" subtitle="Teach your bot about your business and products">
      <style>{`
        /* ── STATS ── */
        .tr-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
        @media (max-width: 900px) { .tr-stats { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 540px) { .tr-stats { grid-template-columns: repeat(2, 1fr); } }
        .tr-stat-card {
          background: linear-gradient(135deg, #1A3D35, #142E28);
          border: 1px solid #2A4A42;
          border-radius: 14px;
          padding: 16px;
        }
        .tr-stat-icon { font-size: 22px; margin-bottom: 8px; }
        .tr-stat-label { font-size: 11px; color: #8A7560; margin-bottom: 4px; }
        .tr-stat-val { font-size: 22px; font-weight: 700; color: #F7E7CE; font-family: 'Cormorant Garamond', serif; }

        /* ── MESSAGE ── */
        .tr-msg {
          padding: 12px 16px; border-radius: 10px;
          font-size: 13px; margin-bottom: 20px; line-height: 1.5;
        }
        .tr-msg.success { background: rgba(76,175,130,0.1); color: #4CAF82; border: 1px solid rgba(76,175,130,0.2); }
        .tr-msg.error   { background: rgba(224,92,92,0.1);  color: #E05C5C; border: 1px solid rgba(224,92,92,0.2); }

        /* ── TABS ── */
        .tr-tabs {
          display: flex; gap: 4px;
          background: #0D2420; padding: 4px;
          border-radius: 14px; margin-bottom: 24px;
          width: fit-content; max-width: 100%;
          overflow-x: auto; scrollbar-width: none;
        }
        .tr-tabs::-webkit-scrollbar { display: none; }
        .tr-tab {
          padding: 9px 18px; border-radius: 10px;
          font-size: 13px; font-weight: 500;
          border: none; cursor: pointer;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
          background: transparent; color: #C4A882;
          transition: all 0.2s;
        }
        .tr-tab:hover { color: #F7E7CE; }
        .tr-tab.active { background: #1A3D35; color: #D4A853; border: 1px solid rgba(212,168,83,0.2); }

        /* ── MAIN GRID ── */
        .tr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .tr-grid { grid-template-columns: 1fr; } }

        /* ── CARD ── */
        .tr-card {
          background: linear-gradient(135deg, #1A3D35, #142E28);
          border: 1px solid #2A4A42;
          border-radius: 18px;
          padding: 24px;
        }
        .tr-card-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px; font-weight: 700;
          color: #F7E7CE; margin-bottom: 6px;
        }
        .tr-card-sub { font-size: 12px; color: #8A7560; margin-bottom: 20px; line-height: 1.5; }

        /* ── INFO BOX ── */
        .tr-info {
          padding: 12px 14px;
          background: #0D2420;
          border-left: 3px solid #D4A853;
          border-radius: 0 8px 8px 0;
          font-size: 12px; color: #C4A882;
          line-height: 1.6; margin-bottom: 16px;
        }

        /* ── URL INPUT ── */
        .tr-url-row { display: flex; gap: 10px; margin-bottom: 16px; }
        .tr-input {
          flex: 1; min-width: 0;
          padding: 11px 14px;
          background: #0D2420;
          border: 1px solid #2A4A42;
          border-radius: 10px;
          color: #F7E7CE; font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none; transition: border 0.2s;
        }
        .tr-input::placeholder { color: #8A7560; }
        .tr-input:focus { border-color: #D4A853; box-shadow: 0 0 0 3px rgba(212,168,83,0.1); }
        .tr-btn {
          padding: 11px 20px;
          background: linear-gradient(135deg, #D4A853, #C4983F);
          color: #0D2420; font-size: 14px; font-weight: 600;
          border: none; border-radius: 10px;
          cursor: pointer; white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s; flex-shrink: 0;
        }
        .tr-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(212,168,83,0.3); }
        .tr-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .tr-btn-full { width: 100%; padding: 13px; }
        @media (max-width: 480px) { .tr-url-row { flex-direction: column; } .tr-btn { width: 100%; } }

        /* ── PROGRESS ── */
        .tr-progress-box {
          background: #0D2420; border: 1px solid #2A4A42;
          border-radius: 12px; padding: 18px;
        }
        .tr-progress-header { display: flex; justify-content: space-between; font-size: 12px; color: #C4A882; margin-bottom: 8px; }
        .tr-bar-bg { height: 6px; background: #2A4A42; border-radius: 999px; overflow: hidden; margin-bottom: 16px; }
        .tr-bar-fill { height: 100%; background: linear-gradient(90deg, #D4A853, #F0C96A); border-radius: 999px; transition: width 0.5s ease; }
        .tr-step { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #C4A882; padding: 3px 0; }
        .tr-step-dot {
          width: 18px; height: 18px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; flex-shrink: 0;
        }
        .tr-step-dot.done   { background: rgba(76,175,130,0.15); border: 1px solid #4CAF82; color: #4CAF82; }
        .tr-step-dot.active { background: rgba(212,168,83,0.15); border: 1px solid #D4A853; color: #D4A853; }
        .tr-step-dot.idle   { background: rgba(42,74,66,0.5); border: 1px solid #2A4A42; }

        /* ── UPLOAD ZONE ── */
        .tr-upload-zone {
          border: 2px dashed #2A4A42; border-radius: 14px;
          padding: 36px 20px; text-align: center;
          background: #0D2420; transition: all 0.2s;
          cursor: pointer;
        }
        .tr-upload-zone:hover { border-color: rgba(212,168,83,0.4); background: rgba(212,168,83,0.02); }

        /* ── TEXTAREA ── */
        .tr-textarea {
          width: 100%; padding: 12px 14px;
          background: #0D2420; border: 1px solid #2A4A42;
          border-radius: 10px; color: #F7E7CE;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          line-height: 1.6; resize: vertical; min-height: 140px;
          outline: none; transition: border 0.2s;
        }
        .tr-textarea::placeholder { color: #8A7560; }
        .tr-textarea:focus { border-color: #D4A853; box-shadow: 0 0 0 3px rgba(212,168,83,0.1); }

        /* ── HISTORY ── */
        .tr-history-list { display: flex; flex-direction: column; gap: 8px; max-height: 380px; overflow-y: auto; }
        .tr-history-item {
          display: flex; align-items: flex-start; gap: 12px;
          background: #0D2420; border: 1px solid #2A4A42;
          border-radius: 10px; padding: 12px 14px;
          transition: border 0.2s;
        }
        .tr-history-item:hover { border-color: rgba(212,168,83,0.2); }
        .tr-history-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
        .tr-history-info { flex: 1; min-width: 0; }
        .tr-history-name { font-size: 13px; font-weight: 500; color: #F7E7CE; word-break: break-all; margin-bottom: 3px; }
        .tr-history-meta { font-size: 11px; color: #8A7560; }
        .tr-type-pill {
          display: inline-block; padding: 2px 8px;
          border-radius: 999px; font-size: 10px; font-weight: 500;
          margin-bottom: 4px;
        }
        .tr-type-website { background: rgba(76,175,130,0.1); color: #4CAF82; border: 1px solid rgba(76,175,130,0.2); }
        .tr-type-pdf     { background: rgba(212,168,83,0.1); color: #D4A853; border: 1px solid rgba(212,168,83,0.2); }
        .tr-type-text    { background: rgba(196,168,130,0.1); color: #C4A882; border: 1px solid rgba(196,168,130,0.2); }
        .tr-del-btn { background: none; border: none; color: #8A7560; cursor: pointer; font-size: 16px; flex-shrink: 0; padding: 2px; transition: color 0.2s; }
        .tr-del-btn:hover { color: #E05C5C; }
        .tr-empty { text-align: center; padding: 32px; color: #8A7560; font-size: 13px; }
      `}</style>

      {/* ── STATS ── */}
      <div className="tr-stats">
        <div className="tr-stat-card">
          <div className="tr-stat-icon">📚</div>
          <div className="tr-stat-label">Total Sources</div>
          <div className="tr-stat-val">{stats.totalTrainings}</div>
        </div>
        <div className="tr-stat-card">
          <div className="tr-stat-icon">🌐</div>
          <div className="tr-stat-label">Websites</div>
          <div className="tr-stat-val">{stats.websiteCount}</div>
        </div>
        <div className="tr-stat-card">
          <div className="tr-stat-icon">📄</div>
          <div className="tr-stat-label">PDFs</div>
          <div className="tr-stat-val">{stats.pdfCount}</div>
        </div>
        <div className="tr-stat-card">
          <div className="tr-stat-icon">✏️</div>
          <div className="tr-stat-label">Text Entries</div>
          <div className="tr-stat-val">{stats.textCount}</div>
        </div>
        <div className="tr-stat-card">
          <div className="tr-stat-icon">🧩</div>
          <div className="tr-stat-label">Total Chunks</div>
          <div className="tr-stat-val">{stats.totalChunks}</div>
        </div>
      </div>

      {/* ── MESSAGE ── */}
      {message && (
        <div className={`tr-msg ${message.type}`}>{message.text}</div>
      )}

      {/* ── TABS ── */}
      <div className="tr-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`tr-tab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => { setActiveTab(t.key as any); setMessage(null) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="tr-grid">

        {/* LEFT: Input Panel */}
        <div className="tr-card">

          {/* ── WEBSITE TAB ── */}
          {activeTab === 'website' && (
            <>
              <div className="tr-card-title">Train from Website</div>
              <div className="tr-card-sub">
                Paste your website URL — our AI will crawl and learn from your product pages, services, policies, and business info automatically.
              </div>
              <div className="tr-info">
                💡 Works best with product pages, FAQs, about pages, and policy pages. Bot will answer exactly from your website content.
              </div>

              <div className="tr-url-row">
                <input
                  className="tr-input"
                  type="url"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  onKeyDown={e => e.key === 'Enter' && !isTraining && handleWebsiteTraining()}
                  disabled={isTraining}
                />
                <button
                  className="tr-btn"
                  onClick={handleWebsiteTraining}
                  disabled={!websiteUrl.trim() || isTraining}
                >
                  {isTraining ? '⏳ Training...' : '🚀 Train'}
                </button>
              </div>

              {/* Progress */}
              {isTraining && (
                <div className="tr-progress-box">
                  <div className="tr-progress-header">
                    <span>{progressLabel || 'Starting...'}</span>
                    <span>{trainingProgress}%</span>
                  </div>
                  <div className="tr-bar-bg">
                    <div className="tr-bar-fill" style={{ width: `${trainingProgress}%` }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {progressSteps.map((s, i) => {
                      const done = trainingProgress >= s.threshold
                      const prev = i === 0 ? 0 : progressSteps[i - 1].threshold
                      const active = !done && trainingProgress >= prev
                      return (
                        <div className="tr-step" key={i}>
                          <div className={`tr-step-dot ${done ? 'done' : active ? 'active' : 'idle'}`}>
                            {done ? '✓' : active ? '⟳' : ''}
                          </div>
                          <span>{s.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── PDF TAB ── */}
          {activeTab === 'pdf' && (
            <>
              <div className="tr-card-title">Upload PDF Document</div>
              <div className="tr-card-sub">
                Upload product catalogs, price lists, FAQs, or any PDF document to train your bot.
              </div>
              <input
                type="file" accept=".pdf"
                onChange={handlePDFUpload}
                disabled={uploading}
                className="hidden" id="pdf-upload"
              />
              <label htmlFor="pdf-upload">
                <div className="tr-upload-zone">
                  <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.7 }}>📄</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#F7E7CE', marginBottom: 6 }}>
                    {uploading ? '⏳ Uploading...' : 'Click to upload PDF'}
                  </div>
                  <div style={{ fontSize: 12, color: '#8A7560' }}>Max 10MB • PDF only</div>
                </div>
              </label>
            </>
          )}

          {/* ── TEXT TAB ── */}
          {activeTab === 'text' && (
            <>
              <div className="tr-card-title">Add Manual Text</div>
              <div className="tr-card-sub">
                Manually add product descriptions, FAQs, policies, or any text you want your bot to know.
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#C4A882', marginBottom: 6, fontWeight: 500 }}>
                  Title (Optional)
                </label>
                <input
                  className="tr-input"
                  type="text"
                  value={textTitle}
                  onChange={e => setTextTitle(e.target.value)}
                  placeholder="e.g., Delivery Policy"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#C4A882', marginBottom: 6, fontWeight: 500 }}>
                  Text Content
                </label>
                <textarea
                  className="tr-textarea"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Enter information about your business, products, services, pricing, policies..."
                  rows={7}
                />
                <div style={{ fontSize: 11, color: '#8A7560', textAlign: 'right', marginTop: 4 }}>
                  {textInput.length} / 50,000
                </div>
              </div>
              <button
                className={`tr-btn tr-btn-full`}
                onClick={handleTextSubmit}
                disabled={textSubmitting || !textInput.trim()}
              >
                {textSubmitting ? '⏳ Saving...' : '✏️ Add Training'}
              </button>
            </>
          )}
        </div>

        {/* RIGHT: History */}
        <div className="tr-card">
          <div className="tr-card-title">Training History</div>
          <div className="tr-card-sub">All sources your bot has learned from.</div>

          {trainingHistory.length === 0 ? (
            <div className="tr-empty">
              <div style={{ fontSize: 32, marginBottom: 10 }}>🤖</div>
              <div>No training data yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Add a website URL, PDF, or text to get started!</div>
            </div>
          ) : (
            <div className="tr-history-list">
              {trainingHistory.map((item: any, i: number) => (
                <div className="tr-history-item" key={i}>
                  <div className="tr-history-icon">
                    {item.source_type === 'website' ? '🌐' : item.source_type === 'pdf' ? '📄' : '✏️'}
                  </div>
                  <div className="tr-history-info">
                    <div className={`tr-type-pill ${
                      item.source_type === 'website' ? 'tr-type-website' :
                      item.source_type === 'pdf' ? 'tr-type-pdf' : 'tr-type-text'
                    }`}>
                      {item.source_type === 'website' ? 'Website' :
                       item.source_type === 'pdf' ? 'PDF' : 'Text'}
                    </div>
                    <div className="tr-history-name">
                      {item.source_url || item.source_type}
                    </div>
                    <div className="tr-history-meta">
                      {item.chunks_count ? `${item.chunks_count} chunks • ` : ''}
                      {new Date(item.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <button
                    className="tr-del-btn"
                    onClick={() => handleDelete(item.source_type, item.source_url)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}