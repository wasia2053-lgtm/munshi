'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'

interface TrainingData {
  id: string
  source_type: 'pdf' | 'text'
  source_url: string
  content: string
  chunks_count: number
  created_at: string
}

interface Stats {
  totalTrainings: number
  totalChunks: number
  totalSize: number
  pdfCount: number
  textCount: number
}

export default function TrainingPage() {
  const [user, setUser] = useState<any>(null)
  const [businessId, setBusinessId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [trainingHistory, setTrainingHistory] = useState<TrainingData[]>([])
  const [stats, setStats] = useState<Stats>({
    totalTrainings: 0,
    totalChunks: 0,
    totalSize: 0,
    pdfCount: 0,
    textCount: 0,
  })

  // Text input state
  const [textInput, setTextInput] = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [textSubmitting, setTextSubmitting] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState<'pdf' | 'text'>('pdf')

  // Fetch user and business data
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        // Get business ID from user metadata or fetch from businesses table
        const bid = session.user.user_metadata?.business_id || '00000000-0000-0000-0000-000000000001'
        setBusinessId(bid)
      }
      setLoading(false)
    }

    fetchUser()
  }, [])

  // Fetch training history
  useEffect(() => {
    if (businessId) {
      fetchTrainingHistory()
    }
  }, [businessId])

  const fetchTrainingHistory = async () => {
    try {
      const response = await fetch(`/api/training/history?businessId=${businessId}`)
      const result = await response.json()
      if (result.success) {
        setTrainingHistory(result.data)
        setStats(result.stats)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  // Handle PDF upload
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessId', businessId)

      const response = await fetch('/api/training/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        // Success
        alert(`PDF uploaded successfully!\n${result.chunks} chunks created`)
        await fetchTrainingHistory()
        e.target.value = '' // Reset input
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload PDF')
    } finally {
      setUploading(false)
    }
  }

  // Handle text training submission
  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      alert('Please enter some text to train')
      return
    }

    setTextSubmitting(true)
    try {
      const response = await fetch('/api/training/add-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          text: textInput,
          title: textTitle || 'Manual Entry',
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`Text training added!\n${result.chunks} chunks created`)
        setTextInput('')
        setTextTitle('')
        await fetchTrainingHistory()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Training error:', error)
      alert('Failed to add text training')
    } finally {
      setTextSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this training data?')) return

    try {
      const response = await fetch('/api/training/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, businessId }),
      })

      const result = await response.json()

      if (result.success) {
        alert('Training data deleted')
        await fetchTrainingHistory()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete training data')
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Train Bot" subtitle="Upload documents or add text to train your AI bot">
        <div className="text-[#F7E7CE]">Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Train Bot" subtitle="Upload documents or add text to train your AI bot">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 lg:mb-6">
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5">
          <div className="text-2xl mb-2">📚</div>
          <div className="text-xs text-[#8A7560] mb-1">Total Trainings</div>
          <div className="text-[#F7E7CE] font-bold text-lg">{stats.totalTrainings}</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5">
          <div className="text-2xl mb-2">📄</div>
          <div className="text-xs text-[#8A7560] mb-1">PDF Uploads</div>
          <div className="text-[#F7E7CE] font-bold text-lg">{stats.pdfCount}</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5">
          <div className="text-2xl mb-2">✏️</div>
          <div className="text-xs text-[#8A7560] mb-1">Text Entries</div>
          <div className="text-[#F7E7CE] font-bold text-lg">{stats.textCount}</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5">
          <div className="text-2xl mb-2">🧩</div>
          <div className="text-xs text-[#8A7560] mb-1">Total Chunks</div>
          <div className="text-[#F7E7CE] font-bold text-lg">{stats.totalChunks}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 lg:mb-6">
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'pdf'
              ? 'bg-[#D4A853] text-[#0D2420]'
              : 'bg-[#1A3D35] text-[#C4A882] border border-[#2A4A42]'
          }`}
        >
          📄 Upload PDF
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'text'
              ? 'bg-[#D4A853] text-[#0D2420]'
              : 'bg-[#1A3D35] text-[#C4A882] border border-[#2A4A42]'
          }`}
        >
          ✏️ Add Text
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {/* Upload Section */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-4 sm:p-5 lg:p-6">
          {activeTab === 'pdf' ? (
            <div>
              <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-2">Upload PDF Document</h3>
              <p className="text-xs sm:text-sm text-[#8A7560] mb-4">
                Upload a PDF file to extract and train your bot with the content.
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePDFUpload}
                  disabled={uploading}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="border-2 border-dashed border-[#2A4A42] rounded-lg p-6 sm:p-8 text-center hover:border-[#D4A853] transition-colors cursor-pointer">
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
              <p className="text-xs sm:text-sm text-[#8A7560] mb-4">
                Manually add text to train your bot. Perfect for FAQs and product info.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#C4A882] mb-2">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="e.g., Product FAQ"
                    className="w-full bg-[#0D2420] border border-[#2A4A42] rounded-lg px-3 py-2 text-sm text-[#F7E7CE] placeholder-[#8A7560] focus:border-[#D4A853] focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#C4A882] mb-2">
                    Text Content
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste your training text here..."
                    rows={6}
                    className="w-full bg-[#0D2420] border border-[#2A4A42] rounded-lg px-3 py-2 text-sm text-[#F7E7CE] placeholder-[#8A7560] focus:border-[#D4A853] focus:outline-none transition-all resize-none"
                  />
                  <div className="text-xs text-[#8A7560] mt-2">
                    {textInput.length} / 50,000 characters
                  </div>
                </div>

                <button
                  onClick={handleTextSubmit}
                  disabled={textSubmitting || !textInput.trim()}
                  className="w-full bg-gradient-to-r from-[#D4A853] to-[#E8C869] text-[#0D2420] font-semibold py-2.5 sm:py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {textSubmitting ? 'Adding...' : '✏️ Add Training'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Training History */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-4 sm:p-5 lg:p-6">
          <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-4">Training History</h3>

          {trainingHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#8A7560] text-sm">No training data yet.</p>
              <p className="text-[#8A7560] text-xs mt-1">Upload a PDF or add text to get started.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {trainingHistory.map((training) => (
                <div
                  key={training.id}
                  className="bg-[#0D2420] border border-[#2A4A42] rounded-lg p-3 hover:border-[rgba(212,168,83,0.3)] transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {training.source_type === 'pdf' ? '📄' : '✏️'}
                        </span>
                        <h4 className="font-semibold text-[#F7E7CE] text-sm truncate">
                          {training.source_url}
                        </h4>
                      </div>
                      <div className="text-xs text-[#8A7560]">
                        {training.chunks_count} chunks • {(training.content.length / 1024).toFixed(1)}KB
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