'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [botName, setBotName] = useState('Munshi Assistant')
  const [botTone, setBotTone] = useState('professional')
  const [language, setLanguage] = useState('english')
  const [userName, setUserName] = useState('Ahmad Raza')
  const [userEmail, setUserEmail] = useState('ahmad@stylehub.pk')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSavePersonality = () => {
    // Save bot personality settings
    console.log('Saving personality settings:', { botName, botTone, language })
  }

  const handleSaveProfile = () => {
    // Save user profile settings
    console.log('Saving profile settings:', { userName, userEmail })
  }

  const handleSavePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    // Save password settings
    console.log('Saving password settings')
  }

  return (
    <DashboardLayout 
      title="Settings" 
      subtitle="Configure your bot and account preferences"
    >
      <div className="space-y-6">
        {/* Bot Personality */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-6">Bot Personality</h3>
          
          {/* Bot Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#C4A882] mb-2">
              Bot Name
            </label>
            <input
              type="text"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className="w-full px-4 py-3 bg-[#0D2420] border border-[#2A4A42] rounded-lg text-[#F7E7CE] placeholder-[#8A7560] focus:outline-none focus:border-[#D4A853] focus:ring-3 focus:ring-[rgba(212,168,83,0.1)] transition-all"
            />
          </div>

          {/* Tone Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#C4A882] mb-3">
              Communication Tone
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'professional', label: 'Professional', icon: '👔', desc: 'Formal and business-like' },
                { value: 'friendly', label: 'Friendly', icon: '😊', desc: 'Warm and approachable' },
                { value: 'casual', label: 'Casual', icon: '🤙', desc: 'Relaxed and informal' },
              ].map((tone) => (
                <div
                  key={tone.value}
                  onClick={() => setBotTone(tone.value)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all text-center bg-[#0D2420] ${
                    botTone === tone.value
                      ? 'border-[rgba(212,168,83,0.4)] bg-[rgba(212,168,83,0.07)] text-[#D4A853]'
                      : 'border-[#2A4A42] hover:border-[rgba(196,168,130,0.3)] hover:bg-[rgba(247,231,206,0.02)]'
                  }`}
                >
                  <div className="text-2xl mb-2">{tone.icon}</div>
                  <div className="text-sm font-medium">{tone.label}</div>
                  <div className="text-xs text-[#8A7560] mt-1">{tone.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#C4A882] mb-3">
              Primary Language
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { value: 'english', label: 'English', icon: '🇬🇧' },
                { value: 'urdu', label: 'Urdu', icon: '🇵🇰' },
                { value: 'hindi', label: 'Hindi', icon: '🇮🇳' },
                { value: 'arabic', label: 'Arabic', icon: '🇸🇦' },
              ].map((lang) => (
                <div
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all text-center bg-[#0D2420] ${
                    language === lang.value
                      ? 'border-[rgba(212,168,83,0.4)] bg-[rgba(212,168,83,0.07)] text-[#D4A853]'
                      : 'border-[#2A4A42] hover:border-[rgba(196,168,130,0.3)] hover:bg-[rgba(247,231,206,0.02)]'
                  }`}
                >
                  <div className="text-2xl mb-2">{lang.icon}</div>
                  <div className="text-sm font-medium">{lang.label}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSavePersonality}
            className="px-6 py-3 bg-gradient-to-r from-[#D4A853] to-[#C4983F] text-[#0D2420] font-semibold rounded-lg hover:transform hover:translateY-[-2px] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)] transition-all"
          >
            Save Personality Settings
          </button>
        </div>

        {/* Profile Settings */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-6">Profile</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[#C4A882] mb-2">
                Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 bg-[#0D2420] border border-[#2A4A42] rounded-lg text-[#F7E7CE] placeholder-[#8A7560] focus:outline-none focus:border-[#D4A853] focus:ring-3 focus:ring-[rgba(212,168,83,0.1)] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#C4A882] mb-2">
                Email
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#0D2420] border border-[#2A4A42] rounded-lg text-[#F7E7CE] placeholder-[#8A7560] focus:outline-none focus:border-[#D4A853] focus:ring-3 focus:ring-[rgba(212,168,83,0.1)] transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            className="px-6 py-3 bg-gradient-to-r from-[#D4A853] to-[#C4983F] text-[#0D2420] font-semibold rounded-lg hover:transform hover:translateY-[-2px] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)] transition-all"
          >
            Save Profile
          </button>
        </div>

        {/* Password Settings */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-6">Change Password</h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[#C4A882] mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#0D2420] border border-[#2A4A42] rounded-lg text-[#F7E7CE] placeholder-[#8A7560] focus:outline-none focus:border-[#D4A853] focus:ring-3 focus:ring-[rgba(212,168,83,0.1)] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#C4A882] mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#0D2420] border border-[#2A4A42] rounded-lg text-[#F7E7CE] placeholder-[#8A7560] focus:outline-none focus:border-[#D4A853] focus:ring-3 focus:ring-[rgba(212,168,83,0.1)] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#C4A882] mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#0D2420] border border-[#2A4A42] rounded-lg text-[#F7E7CE] placeholder-[#8A7560] focus:outline-none focus:border-[#D4A853] focus:ring-3 focus:ring-[rgba(212,168,83,0.1)] transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleSavePassword}
            className="px-6 py-3 bg-gradient-to-r from-[#D4A853] to-[#C4983F] text-[#0D2420] font-semibold rounded-lg hover:transform hover:translateY-[-2px] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)] transition-all"
          >
            Update Password
          </button>
        </div>

        {/* Plan Settings */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-6">Plan</h3>
          
          <div className="p-6 bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.2)] rounded-xl mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="font-serif text-xl font-bold text-[#D4A853]">Free Plan</div>
                <div className="text-sm text-[#8A7560]">Perfect for getting started</div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[rgba(212,168,83,0.15)] text-[#D4A853] border border-[rgba(212,168,83,0.25)]">
                Current
              </span>
            </div>
            
            <div className="space-y-2">
              {[
                'Up to 500 messages per month',
                'Basic bot training',
                '1 WhatsApp connection',
                'Email support',
                'Basic analytics',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-[#C4A882]">
                  <span className="text-[#4CAF82]">✓</span>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <button className="w-full px-6 py-3 bg-gradient-to-r from-[#D4A853] to-[#C4983F] text-[#0D2420] font-semibold rounded-lg hover:transform hover:translateY-[-2px] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)] transition-all">
            Upgrade to Growth Plan
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
