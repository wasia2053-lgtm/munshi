'use client'
export const dynamic = 'force-dynamic';


import React, { useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import Toast from '@/components/Toast'
const BUSINESS_ID = '00000000-0000-0000-0000-000000000001'

export default function SettingsPage() {
  const [botName, setBotName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [tone, setTone] = useState('friendly')
  const [language, setLanguage] = useState('roman_urdu')
  const [greeting, setGreeting] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [userName, setUserName] = useState('Ahmad Raza')
  const [userEmail, setUserEmail] = useState('ahmad@stylehub.pk')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'growth' | 'pro'>('growth')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  
  // Operating Hours State
  const [operatingHours, setOperatingHours] = useState({
    monday: { enabled: false, open: '09:00', close: '18:00' },
    tuesday: { enabled: false, open: '09:00', close: '18:00' },
    wednesday: { enabled: false, open: '09:00', close: '18:00' },
    thursday: { enabled: false, open: '09:00', close: '18:00' },
    friday: { enabled: false, open: '09:00', close: '18:00' },
    saturday: { enabled: false, open: '09:00', close: '18:00' },
    sunday: { enabled: false, open: '09:00', close: '18:00' }
  })
  
  // Away Message State
  const [awayMessage, setAwayMessage] = useState('')
  
  // Toast State
  const [toast, setToast] = useState<{message:string, type:'success'|'error'|'info'} | null>(null)


React.useEffect(() => {
  fetch('/api/settings/get', { credentials: 'include' })
    .then(r => r.json())
    .then(data => {
      setBotName(data.bot_name || '')
      setOrgName(data.organization_name || '')
      setLanguage(data.language || 'roman_urdu')
      setTone(data.tone || 'friendly')
      setGreeting(data.greeting_message || '')
      
      // Load operating hours
      if (data.operating_hours) {
        setOperatingHours(data.operating_hours)
      }
      
      // Load away message
      if (data.away_message) {
        setAwayMessage(data.away_message)
      }
    })
}, [])


const handleSave = async () => {
  const res = await fetch('/api/settings/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      bot_name: botName,
      organization_name: orgName,
      language: language,
      tone: tone,
      greeting_message: greeting,
    })
  })
  if (res.ok) {
    setToast({ message: 'Settings save ho gayi! ✅', type: 'success' })
    setTimeout(() => setToast(null), 3000)
  } else {
    setToast({ message: 'Kuch masla hua, dobara try karo ❌', type: 'error' })
    setTimeout(() => setToast(null), 3000)
  }
}

const handleSaveOperatingHours = async () => {
  const res = await fetch('/api/settings/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      operating_hours: operatingHours
    })
  })
  if (res.ok) {
    setToast({ message: 'Operating hours save ho gayi! ✅', type: 'success' })
    setTimeout(() => setToast(null), 3000)
  } else {
    setToast({ message: 'Kuch masla hua, dobara try karo ❌', type: 'error' })
    setTimeout(() => setToast(null), 3000)
  }
}

const handleSaveAwayMessage = async () => {
  const res = await fetch('/api/settings/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      away_message: awayMessage
    })
  })
  if (res.ok) {
    setToast({ message: 'Away message save ho gayi! ✅', type: 'success' })
    setTimeout(() => setToast(null), 3000)
  } else {
    setToast({ message: 'Kuch masla hua, dobara try karo ❌', type: 'error' })
    setTimeout(() => setToast(null), 3000)
  }
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

  const handleUpgrade = (plan: 'growth' | 'pro') => {
    setSelectedPlan(plan)
    setShowPaymentModal(true)
    setPaymentSubmitted(false)
  }

  const handlePaymentSubmit = async () => {
    setIsProcessingPayment(true)
    
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          plan: selectedPlan,
          userId: 'current-user' // Replace with actual user ID from auth
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPaymentSubmitted(true)
        setTimeout(() => {
          setShowPaymentModal(false)
          setPaymentSubmitted(false)
        }, 3000)
      } else {
        alert('Failed to process payment')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Failed to process payment')
    } finally {
      setIsProcessingPayment(false)
    }
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

          {/* Organization Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#C4A882] mb-2">
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-4 py-3 bg-[#0D2420] border border-[#2A4A42] rounded-lg text-[#F7E7CE] placeholder-[#8A7560] focus:outline-none focus:border-[#D4A853] focus:ring-3 focus:ring-[rgba(212,168,83,0.1)] transition-all"
            />
          </div>

          {/* Greeting Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#C4A882] mb-2">
              Greeting Message
            </label>
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              className="w-full px-4 py-3 bg-[#0D2420] border border-[#2A4A42] rounded-lg text-[#F7E7CE] placeholder-[#8A7560] focus:outline-none focus:border-[#D4A853] focus:ring-3 focus:ring-[rgba(212,168,83,0.1)] transition-all resize-none"
              rows={3}
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
              ].map((toneOption) => (
                <div
                  key={toneOption.value}
                  onClick={() => setTone(toneOption.value)}
                  className={`border-2 p-4 rounded-xl cursor-pointer transition-all text-center bg-[#0D2420] ${
        tone === toneOption.value
          ? 'border-[#D4A853] bg-[rgba(212,168,83,0.15)] text-[#D4A853]'
          : 'border-transparent hover:border-[rgba(196,168,130,0.3)]'
      }`}
                  style={{
                    border: tone === toneOption.value ? '2px solid #D4A853' : '2px solid transparent',
                    backgroundColor: tone === toneOption.value ? 'rgba(212,168,83,0.15)' : ''
                  }}
                >
                  <div className="text-2xl mb-2">{toneOption.icon}</div>
                  <div className="text-sm font-medium">{toneOption.label}</div>
                  <div className="text-xs text-[#8A7560] mt-1">{toneOption.desc}</div>
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
                  { value: 'english_us', label: 'English (US)', icon: '🇺🇸' },
                  { value: 'english_uk', label: 'English (UK)', icon: '🇬🇧' },
                  { value: 'roman_urdu', label: 'Roman Urdu', icon: '🇵🇰' },
                  { value: 'arabic', label: 'Arabic', icon: '🇸🇦' },
                ].map((langOption) => (
                <div
                  key={langOption.value}
                  onClick={() => setLanguage(langOption.value)}
                  className={`border-2 p-4 rounded-xl cursor-pointer transition-all text-center bg-[#0D2420] ${
  language === langOption.value
    ? 'border-[#D4A853] bg-[rgba(212,168,83,0.15)] text-[#D4A853]'
    : 'border-[#0D2420]'
}`}
                >
                  <div className="text-2xl mb-2">{langOption.icon}</div>
                  <div className="text-sm font-medium">{langOption.label}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
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

          <button 
            onClick={() => handleUpgrade('growth')}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#D4A853] to-[#C4983F] text-[#0D2420] font-semibold rounded-lg hover:transform hover:translateY-[-2px] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)] transition-all"
          >
            Upgrade to Growth Plan
          </button>
        </div>

        {/* Operating Hours */}
        <div style={{
          backgroundColor: '#0D2420',
          border: '1px solid #2A4A42',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontFamily: 'serif',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#F7E7CE',
            marginBottom: '24px'
          }}>
            Operating Hours
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {Object.entries(operatingHours).map(([day, hours]) => (
              <div key={day} style={{
                backgroundColor: '#1A3D35',
                border: '1px solid #2A4A42',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#D4A853',
                    textTransform: 'capitalize'
                  }}>
                    {day.slice(0, 3)}
                  </span>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '44px',
                    height: '24px'
                  }}>
                    <input
                      type="checkbox"
                      checked={hours.enabled}
                      onChange={(e) => setOperatingHours(prev => ({
                        ...prev,
                        [day]: { ...prev[day as keyof typeof prev], enabled: e.target.checked }
                      }))}
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: hours.enabled ? '#D4A853' : '#2A4A42',
                      transition: '.4s',
                      borderRadius: '24px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: hours.enabled ? '20px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        transition: '.4s',
                        borderRadius: '50%'
                      }}></span>
                    </span>
                  </label>
                </div>
                
                {hours.enabled && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#8A7560',
                        marginBottom: '4px'
                      }}>
                        Open
                      </label>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => setOperatingHours(prev => ({
                          ...prev,
                          [day]: { ...prev[day as keyof typeof prev], open: e.target.value }
                        }))}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          backgroundColor: '#0D2420',
                          border: '1px solid #2A4A42',
                          borderRadius: '4px',
                          color: '#F7E7CE',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#8A7560',
                        marginBottom: '4px'
                      }}>
                        Close
                      </label>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => setOperatingHours(prev => ({
                          ...prev,
                          [day]: { ...prev[day as keyof typeof prev], close: e.target.value }
                        }))}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          backgroundColor: '#0D2420',
                          border: '1px solid #2A4A42',
                          borderRadius: '4px',
                          color: '#F7E7CE',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={handleSaveOperatingHours}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: '#D4A853',
              color: '#102C26',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Save Operating Hours
          </button>
        </div>

        {/* Away Message */}
        <div style={{
          backgroundColor: '#0D2420',
          border: '1px solid #2A4A42',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h3 style={{
            fontFamily: 'serif',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#F7E7CE',
            marginBottom: '24px'
          }}>
            Away Message
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#C4A882',
              marginBottom: '12px'
            }}>
              Away Message
            </label>
            <textarea
              value={awayMessage}
              onChange={(e) => setAwayMessage(e.target.value)}
              placeholder="Abhi available nahi hen. Thori der baad contact karein ya website visit karein."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px 16px',
                backgroundColor: '#1A3D35',
                border: '1px solid #2A4A42',
                borderRadius: '8px',
                color: '#F7E7CE',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: '#8A7560',
              marginTop: '8px',
              lineHeight: '1.4'
            }}>
              Ye message tab jayega jab bot operating hours ke bahar message receive kare
            </p>
          </div>
          
          <button
            onClick={handleSaveAwayMessage}
            style={{
              padding: '12px 24px',
              backgroundColor: '#D4A853',
              color: '#102C26',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Save Away Message
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-8 max-w-md w-full">
            {!paymentSubmitted ? (
              <>
                <h3 className="font-serif text-2xl font-bold text-[#F7E7CE] mb-2">
                  Upgrade to {selectedPlan === 'growth' ? 'Growth' : 'Pro'} Plan
                </h3>
                <div className="text-3xl font-bold text-[#D4A853] mb-6">
                  PKR {selectedPlan === 'growth' ? '7,000' : '20,000'}
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-[#0D2420] border border-[#2A4A42] rounded-lg p-4">
                    <div className="text-sm text-[#8A7560] mb-1">JazzCash</div>
                    <div className="text-lg font-semibold text-[#F7E7CE]">03XX-XXXXXXX</div>
                  </div>
                  <div className="bg-[#0D2420] border border-[#2A4A42] rounded-lg p-4">
                    <div className="text-sm text-[#8A7560] mb-1">EasyPaisa</div>
                    <div className="text-lg font-semibold text-[#F7E7CE]">03XX-XXXXXXX</div>
                  </div>
                  <div className="bg-[#0D2420] border border-[#2A4A42] rounded-lg p-4">
                    <div className="text-sm text-[#8A7560] mb-1">Reference Number</div>
                    <div className="text-lg font-semibold text-[#D4A853]">MUNSHI-CURRENTUSER</div>
                  </div>
                </div>

                <div className="text-sm text-[#8A7560] mb-6">
                  Payment screenshot send karne ke baad "I have paid" button click karein
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-3 border border-[#2A4A42] text-[#C4A882] rounded-lg hover:bg-[#0D2420] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePaymentSubmit}
                    disabled={isProcessingPayment}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#D4A853] to-[#C4983F] text-[#0D2420] font-semibold rounded-lg hover:transform hover:translateY-[-2px] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)] transition-all disabled:opacity-50"
                  >
                    {isProcessingPayment ? 'Processing...' : 'I have paid'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✅</div>
                <div className="text-lg font-semibold text-[#D4A853] mb-2">
                  Payment Under Review
                </div>
                <div className="text-sm text-[#C4A882]">
                  24 hours mein activate ho jaye ga
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showSuccess && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#102C26',
            border: '1px solid #D4A853',
            borderRadius: '16px',
            padding: '40px 48px',
            textAlign: 'center',
            maxWidth: '360px',
            width: '90%',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
            <h3 style={{ color: '#F7E7CE', fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
              Settings Saved!
            </h3>
            <p style={{ color: '#D4A853', fontSize: '0.875rem', marginBottom: '24px' }}>
              Bot personality updated successfully
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              style={{
                backgroundColor: '#D4A853',
                color: '#102C26',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 32px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
