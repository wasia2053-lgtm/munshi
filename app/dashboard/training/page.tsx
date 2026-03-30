'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'

export default function TrainingPage() {
  const [businessId, setBusinessId] = useState('')
  const [trainingHistory, setTrainingHistory] = useState<any[]>([])
  const [stats, setStats] = useState<any>({
    totalTrainings: 0,
    pdfCount: 0,
    textCount: 0,
    totalChunks: 0,
  })
  const [activeTab, setActiveTab] = useState<'pdf' | 'text'>('pdf')
  const [message, setMessage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [textSubmitting, setTextSubmitting] = useState(false)

  // Get business ID on mount
  useEffect(() => {
    const getBusinessId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const bid = session?.user?.user_metadata?.business_id || '00000000-0000-0000-0000-000000000001'
        setBusinessId(bid)
      } catch (error) {
        setBusinessId('00000000-0000-0000-0000-000000000001')
      } finally {
        setLoading(false)
      }
    }
    getBusinessId()
  }, [])

  // Fetch history when businessId changes
  useEffect(() => {
    if (businessId) {
      fetchHistory()
    }
  }, [businessId])

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/train/history?businessId=${businessId}`)
      const result = await res.json()
      if (result.success) {
        setTrainingHistory(result.data || [])
        setStats(result.stats || {})
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handlePDFUpload = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessId', businessId)

      const res = await fetch('/api/train/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (result.success) {
        setMessage({ type: 'success', text: `✅ PDF uploaded! ${result.chunks} chunks created` })
        await fetchHistory()
        e.target.value = ''
      } else {
        setMessage({ type: 'error', text: `❌ ${result.error || 'Failed to upload'}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Error: ${error}` })
    } finally {
      setUploading(false)
    }
  }

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      setMessage({ type: 'error', text: '❌ Please enter text' })
      return
    }

    setTextSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/train/add-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          text: textInput,
          title: textTitle || 'Manual Entry',
        }),
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
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Error: ${error}` })
    } finally {
      setTextSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this training?')) return

    try {
      const res = await fetch('/api/train/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, businessId }),
      })

      const result = await res.json()

      if (result.success) {
        setMessage({ type: 'success', text: '✅ Deleted!' })
        await fetchHistory()
      } else {
        setMessage({ type: 'error', text: `❌ ${result.error || 'Failed'}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Error: ${error}` })
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Train Bot" subtitle="Upload documents or add text">
        <div className="text-[#F7E7CE]">Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Train Bot" subtitle="Upload documents or add text to train your AI bot">
      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-900/20 border border-green-500 text-green-300' 
            : 'bg-red-900/20 border border-red-500 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-4">
          <div className="text-2xl mb-2">📚</div>
          <div className="text-xs text-[#8A7560] mb-1">Total Trainings</div>
          <div className="text-[#F7E7CE] font-bold text-lg">{stats.totalTrainings || 0}</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-4">
          <div className="text-2xl mb-2">📄</div>
          <div className="text-xs text-[#8A7560] mb-1">PDF Uploads</div>
          <div className="text-[#F7E7CE] font-bold text-lg">{stats.pdfCount || 0}</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-4">
          <div className="text-2xl mb-2">✏️</div>
          <div className="text-xs text-[#8A7560] mb-1">Text Entries</div>
          <div className="text-[#F7E7CE] font-bold text-lg">{stats.textCount || 0}</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-4">
          <div className="text-2xl mb-2">🧩</div>
          <div className="text-xs text-[#8A7560] mb-1">Total Chunks</div>
          <div className="text-[#F7E7CE] font-bold text-lg">{stats.totalChunks || 0}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm ${
            activeTab === 'pdf'
              ? 'bg-[#D4A853] text-[#0D2420]'
              : 'bg-[#1A3D35] text-[#C4A882] border border-[#2A4A42]'
          }`}
        >
          📄 Upload PDF
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm ${
            activeTab === 'text'
              ? 'bg-[#D4A853] text-[#0D2420]'
              : 'bg-[#1A3D35] text-[#C4A882] border border-[#2A4A42]'
          }`}
        >
          ✏️ Add Text
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload/Input */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-6">
          {activeTab === 'pdf' ? (
            <div>
              <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-2">Upload PDF Document</h3>
              <p className="text-xs text-[#8A7560] mb-4">Upload a PDF file to train your bot.</p>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePDFUpload}
                  disabled={uploading}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="border-2 border-dashed border-[#2A4A42] rounded-lg p-8 text-center hover:border-[#D4A853] transition-colors cursor-pointer">
                  <div className="text-3xl mb-2">📄</div>
                  <p className="text-sm font-semibold text-[#F7E7CE] mb-1">
                    {uploading ? 'Uploading...' : 'Click to upload PDF'}
                  </p>
                  <p className="text-xs text-[#8A7560]">Max 10MB • PDF only</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-2">Add Text Training</h3>
              <p className="text-xs text-[#8A7560] mb-4">Manually add text to train your bot.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#C4A882] mb-2">Title (Optional)</label>
                  <input
                    type="text"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="e.g., Product FAQ"
                    className="w-full bg-[#0D2420] border border-[#2A4A42] rounded-lg px-3 py-2 text-sm text-[#F7E7CE] placeholder-[#8A7560] focus:border-[#D4A853] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#C4A882] mb-2">Text Content</label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste your text here..."
                    rows={6}
                    className="w-full bg-[#0D2420] border border-[#2A4A42] rounded-lg px-3 py-2 text-sm text-[#F7E7CE] placeholder-[#8A7560] focus:border-[#D4A853] focus:outline-none resize-none"
                  />
                  <div className="text-xs text-[#8A7560] mt-2">
                    {textInput.length} / 50,000 characters
                  </div>
                </div>

                <button
                  onClick={handleTextSubmit}
                  disabled={textSubmitting || !textInput.trim()}
                  className="w-full bg-gradient-to-r from-[#D4A853] to-[#E8C869] text-[#0D2420] font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {textSubmitting ? 'Adding...' : '✏️ Add Training'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-6">
          <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-4">Training History</h3>

          {trainingHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#8A7560] text-sm">No training data yet.</p>
              <p className="text-[#8A7560] text-xs mt-1">Upload a PDF or add text to get started.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {trainingHistory.map((training: any) => (
                <div
                  key={training.id}
                  className="bg-[#0D2420] border border-[#2A4A42] rounded-lg p-3 hover:border-[rgba(212,168,83,0.3)] transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{training.source_type === 'pdf' ? '📄' : '✏️'}</span>
                        <h4 className="font-semibold text-[#F7E7CE] text-sm truncate">
                          {training.source_url}
                        </h4>
                      </div>
                      <div className="text-xs text-[#8A7560]">
                        {training.chunks_count} chunks • {(training.content?.length / 1024).toFixed(1)}KB
                      </div>
                      <div className="text-xs text-[#8A7560] mt-1">
                        {new Date(training.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(training.id)}
                      className="text-[#E05C5C] hover:text-[#FF6B6B] transition-colors text-sm font-semibold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}