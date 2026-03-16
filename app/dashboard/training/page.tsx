
'use client'
export const dynamic = 'force-dynamic';
export const revalidate = 0;
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
      if (user) {
        fetchTrainingHistory(user.id)
      }
    }
    getUser()
  }, [])

  const fetchTrainingHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('business_id', userId)
      .order('created_at', { ascending: false })
    
    if (data && !error) {
      setTrainingHistory(data)
    }
  }

  const handleWebsiteTraining = async () => {
    if (!websiteUrl || !user) return
    setIsTraining(true)
    setTrainingProgress(0)
    setTrainingMessage('')
    
    try {
      const response = await fetch('/api/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: websiteUrl,
          userId: user.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTrainingMessage('Training completed successfully!')
        setWebsiteUrl('')
        // Refresh training history
        fetchTrainingHistory(user.id)
      } else {
        setTrainingMessage(`Training failed: ${data.error}`)
      }
    } catch (error) {
      setTrainingMessage('Training failed: Network error')
    } finally {
      setIsTraining(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
  }

  const handleManualTextSubmit = async () => {
    if (!manualText.trim() || !user) return
    
    try {
      // First check if business exists, create if not
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single()

      let businessId = business?.id

      if (!businessId) {
        const { data: newBusiness } = await supabase
          .from('businesses')
          .insert({ user_id: user.id, name: 'My Store' })
          .select('id')
          .single()
        businessId = newBusiness?.id
      }

      if (!businessId) {
        setTrainingMessage('Failed to create business')
        return
      }

      const { error } = await supabase
        .from('knowledge_base')
        .insert({
          business_id: businessId,
          source_type: 'manual',
          content: manualText,
          chunks_count: 1,
          created_at: new Date().toISOString()
        })
      
      if (error) {
        setTrainingMessage('Failed to save manual text')
      } else {
        setTrainingMessage('Manual text saved successfully!')
        setManualText('')
        // Refresh training history
        fetchTrainingHistory(businessId)
      }
    } catch (error) {
      setTrainingMessage('Failed to save manual text')
    }
  }

  return (
    <DashboardLayout 
      title="Bot Training" 
      subtitle="Teach your bot about your business and services"
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#0D2420] p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('website')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'website'
              ? 'bg-[#1A3D35] text-[#D4A853] border border-[rgba(212,168,83,0.2)]'
              : 'text-[#C4A882] hover:text-[#F7E7CE]'
          }`}
        >
          Website URL
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'pdf'
              ? 'bg-[#1A3D35] text-[#D4A853] border border-[rgba(212,168,83,0.2)]'
              : 'text-[#C4A882] hover:text-[#F7E7CE]'
          }`}
        >
          Upload PDF
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'manual'
              ? 'bg-[#1A3D35] text-[#D4A853] border border-[rgba(212,168,83,0.2)]'
              : 'text-[#C4A882] hover:text-[#F7E7CE]'
          }`}
        >
          Manual Text
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'website' && (
          <div>
            {/* Info Box */}
            <div className="p-4 bg-[#0D2420] border-l-3 border-l-[#D4A853] rounded-r-lg mb-6">
              <p className="text-sm text-[#C4A882] leading-relaxed">
                Enter your website URL and our AI will crawl and learn from your product pages, 
                services, and business information to provide accurate responses to customer queries.
              </p>
            </div>

            {/* URL Input */}
            <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6">
              <div className="flex gap-3 mb-4">
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="flex-1 px-4 py-3 bg-[#0D2420] border border-[#2A4A42] rounded-lg text-[#F7E7CE] placeholder-[#8A7560] focus:outline-none focus:border-[#D4A853] focus:ring-3 focus:ring-[rgba(212,168,83,0.1)] transition-all"
                />
                <button
                  onClick={handleWebsiteTraining}
                  disabled={!websiteUrl || isTraining}
                  className="px-6 py-3 bg-gradient-to-r from-[#D4A853] to-[#C4983F] text-[#0D2420] font-semibold rounded-lg hover:transform hover:translateY-[-2px] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTraining ? 'Training...' : 'Train Bot'}
                </button>
              </div>

              {/* Progress Card */}
              {isTraining && (
                <div className="p-5 bg-[#0D2420] border border-[#2A4A42] rounded-xl">
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-[#C4A882] mb-2">
                      <span>Training Progress</span>
                      <span>{trainingProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-[#2A4A42] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#D4A853] to-[#F0C96A] rounded-full transition-all duration-500"
                        style={{ width: `${trainingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        trainingProgress >= 20 ? 'bg-[rgba(76,175,130,0.15)] border border-[#4CAF82] text-[#4CAF82]' : 'bg-[rgba(42,74,66,0.5)] border border-[#2A4A42] text-[#8A7560]'
                      }`}>
                        {trainingProgress >= 20 ? '✓' : trainingProgress > 0 && trainingProgress < 20 ? '⟳' : ''}
                      </div>
                      <span className="text-[#C4A882]">Analyzing website structure...</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        trainingProgress >= 40 ? 'bg-[rgba(76,175,130,0.15)] border border-[#4CAF82] text-[#4CAF82]' : 'bg-[rgba(42,74,66,0.5)] border border-[#2A4A42] text-[#8A7560]'
                      }`}>
                        {trainingProgress >= 40 ? '✓' : trainingProgress > 20 && trainingProgress < 40 ? '⟳' : ''}
                      </div>
                      <span className="text-[#C4A882]">Extracting content and data...</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        trainingProgress >= 60 ? 'bg-[rgba(76,175,130,0.15)] border border-[#4CAF82] text-[#4CAF82]' : 'bg-[rgba(42,74,66,0.5)] border border-[#2A4A42] text-[#8A7560]'
                      }`}>
                        {trainingProgress >= 60 ? '✓' : trainingProgress > 40 && trainingProgress < 60 ? '⟳' : ''}
                      </div>
                      <span className="text-[#C4A882]">Processing business information...</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        trainingProgress >= 80 ? 'bg-[rgba(76,175,130,0.15)] border border-[#4CAF82] text-[#4CAF82]' : 'bg-[rgba(42,74,66,0.5)] border border-[#2A4A42] text-[#8A7560]'
                      }`}>
                        {trainingProgress >= 80 ? '✓' : trainingProgress > 60 && trainingProgress < 80 ? '⟳' : ''}
                      </div>
                      <span className="text-[#C4A882]">Training AI model...</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        trainingProgress >= 100 ? 'bg-[rgba(76,175,130,0.15)] border border-[#4CAF82] text-[#4CAF82]' : 'bg-[rgba(42,74,66,0.5)] border border-[#2A4A42] text-[#8A7560]'
                      }`}>
                        {trainingProgress >= 100 ? '✓' : trainingProgress > 80 && trainingProgress < 100 ? '⟳' : ''}
                      </div>
                      <span className="text-[#C4A882]">Finalizing and testing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pdf' && (
          <div>
            {/* Upload Area */}
            <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6">
              <div className="border-2 border-dashed border-[#2A4A42] rounded-xl p-12 text-center cursor-pointer hover:border-[rgba(212,168,83,0.4)] hover:bg-[rgba(212,168,83,0.03)] transition-all bg-[#0D2420]">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <div className="text-4xl mb-3 opacity-60">📄</div>
                  <div className="text-base font-medium text-[#F7E7CE] mb-2">
                    Upload PDF Document
                  </div>
                  <div className="text-sm text-[#8A7560]">
                    Drag and drop your PDF here or click to browse
                  </div>
                </label>
              </div>

              {/* File Preview */}
              {uploadedFile && (
                <div className="flex items-center gap-3 p-4 bg-[#0D2420] border border-[#2A4A42] rounded-lg mt-4">
                  <div className="text-2xl">📄</div>
                  <div className="flex-1 text-sm text-[#F7E7CE]">{uploadedFile.name}</div>
                  <button
                    onClick={removeFile}
                    className="text-[#8A7560] hover:text-[#E05C5C] text-xl transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}

              <button
                disabled={!uploadedFile}
                className="w-full mt-4 py-3 bg-gradient-to-r from-[#D4A853] to-[#C4983F] text-[#0D2420] font-semibold rounded-lg hover:transform hover:translateY-[-2px] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Train from PDF
              </button>
            </div>
          </div>
        )}

        {activeTab === 'manual' && (
          <div>
            {/* Manual Text Input */}
            <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#C4A882] mb-2">
                  Business Information
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Enter information about your business, products, services, policies, etc. The more detailed information you provide, the better your bot will be able to assist customers."
                  className="w-full px-4 py-3 bg-[#0D2420] border border-[#2A4A42] rounded-lg text-[#F7E7CE] placeholder-[#8A7560] focus:outline-none focus:border-[#D4A853] focus:ring-3 focus:ring-[rgba(212,168,83,0.1)] transition-all resize-vertical min-h-32 leading-relaxed"
                  rows={8}
                />
                <div className="text-xs text-[#8A7560] mt-2 text-right">
                  {manualText.length} characters
                </div>
              </div>

              <button
                onClick={handleManualTextSubmit}
                disabled={!manualText.trim()}
                className="w-full py-3 bg-gradient-to-r from-[#D4A853] to-[#C4983F] text-[#0D2420] font-semibold rounded-lg hover:transform hover:translateY-[-2px] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Train from Text
              </button>
            </div>
          </div>
        )}

        {/* Training History */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6">
          <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-4">Training History</h3>
          
          {/* Training Message */}
          {trainingMessage && (
            <div className={`p-3 rounded-lg mb-4 text-sm ${
              trainingMessage.includes('successfully') 
                ? 'bg-[rgba(76,175,130,0.1)] text-[#4CAF82]' 
                : 'bg-[rgba(224,92,92,0.1)] text-[#E05C5C]'
            }`}>
              {trainingMessage}
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A4A42]">
                  <th className="text-left p-3 text-xs font-semibold tracking-wider uppercase text-[#8A7560]">Source</th>
                  <th className="text-left p-3 text-xs font-semibold tracking-wider uppercase text-[#8A7560]">Type</th>
                  <th className="text-left p-3 text-xs font-semibold tracking-wider uppercase text-[#8A7560]">Status</th>
                  <th className="text-left p-3 text-xs font-semibold tracking-wider uppercase text-[#8A7560]">Date</th>
                </tr>
              </thead>
              <tbody>
                {trainingHistory.map((item, index) => (
                  <tr key={index} className="border-b border-[rgba(42,74,66,0.4)] hover:bg-[rgba(247,231,206,0.03)] transition-colors">
                    <td className="p-3 text-sm text-[#C4A882]">
                      <span className="text-[#F7E7CE] font-medium">
                        {item.source_type === 'website' ? item.source_url : 
                         item.source_type === 'manual' ? 'Manual Text' : 
                         'Unknown'}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-[#C4A882]">
                      {item.source_type}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[rgba(76,175,130,0.12)] text-[#4CAF82] border border-[rgba(76,175,130,0.25)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF82]"></span>
                        Completed
                      </span>
                    </td>
                    <td className="p-3 text-sm text-[#8A7560]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {trainingHistory.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#8A7560]">
                      No training data found. Start by training your bot with website content or manual text.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
