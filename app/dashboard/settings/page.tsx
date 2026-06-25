'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { motion } from 'framer-motion'
import { Bot, Clock, MessageSquare } from 'lucide-react'
import Toast from '@/components/Toast'

export default function SettingsPage() {
  const [botName, setBotName] = useState('')
  const [tone, setTone] = useState('friendly')
  const [language, setLanguage] = useState('roman_urdu')
  const [awayMessage, setAwayMessage] = useState('')
  const [savingBot, setSavingBot] = useState(false)
  const [savingHours, setSavingHours] = useState(false)
  const [savingAway, setSavingAway] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [operatingHours, setOperatingHours] = useState({
    monday: { enabled: true, open: '09:00', close: '18:00' },
    tuesday: { enabled: true, open: '09:00', close: '18:00' },
    wednesday: { enabled: true, open: '09:00', close: '18:00' },
    thursday: { enabled: true, open: '09:00', close: '18:00' },
    friday: { enabled: true, open: '09:00', close: '18:00' },
    saturday: { enabled: false, open: '09:00', close: '18:00' },
    sunday: { enabled: false, open: '09:00', close: '18:00' },
  })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    fetch('/api/settings/get', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setBotName(data.bot_name || '')
        setLanguage(data.language || 'roman_urdu')
        setTone(data.tone || 'friendly')
        setAwayMessage(data.away_message || '')
        if (data.operating_hours) setOperatingHours(data.operating_hours)
      })
  }, [])

  const handleSaveBot = async () => {
    setSavingBot(true)
    const res = await fetch('/api/settings/save', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_name: botName, language, tone }),
    })
    setSavingBot(false)
    showToast(res.ok ? 'Bot settings saved! ✅' : 'Error saving ❌', res.ok ? 'success' : 'error')
  }

  const handleSaveHours = async () => {
    setSavingHours(true)
    const res = await fetch('/api/settings/save', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operating_hours: operatingHours }),
    })
    setSavingHours(false)
    showToast(res.ok ? 'Operating hours saved! ✅' : 'Error saving ❌', res.ok ? 'success' : 'error')
  }

  const handleSaveAway = async () => {
    setSavingAway(true)
    const res = await fetch('/api/settings/save', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ away_message: awayMessage }),
    })
    setSavingAway(false)
    showToast(res.ok ? 'Away message saved! ✅' : 'Error saving ❌', res.ok ? 'success' : 'error')
  }

  const card: React.CSSProperties = {
    backgroundColor: '#1a1b1c',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
  }

  const input: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    backgroundColor: '#121314',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Geist, sans-serif',
  }

  const btn = (loading?: boolean): React.CSSProperties => ({
    backgroundColor: '#4ae176',
    color: '#121314',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 24px',
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '13px',
    opacity: loading ? 0.7 : 1,
    fontFamily: 'Geist, sans-serif',
  })

  const label: React.CSSProperties = {
    color: '#888',
    fontSize: '13px',
    display: 'block',
    marginBottom: '8px',
  }

  return (
    <AppShell>
      <div style={{ width: '100%', fontFamily: 'Geist, sans-serif' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 600 }}>Settings</h1>
          <p style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>Configure your bot and preferences</p>
        </div>

        {/* Bot Personality */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Bot size={18} color="#4ae176" />
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Bot Personality</h3>
          </div>

          {/* Bot Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={label}>Bot Name</label>
            <input value={botName} onChange={e => setBotName(e.target.value)} style={input} />
          </div>

          {/* Tone */}
          <div style={{ marginBottom: '20px' }}>
            <label style={label}>Communication Tone</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { value: 'professional', label: 'Professional', desc: 'Formal & business-like' },
                { value: 'friendly', label: 'Friendly', desc: 'Warm & approachable' },
                { value: 'casual', label: 'Casual', desc: 'Relaxed & informal' },
              ].map(t => (
                <div
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  style={{
                    flex: '1 1 140px',
                    padding: '14px',
                    borderRadius: '10px',
                    border: `1px solid ${tone === t.value ? '#4ae176' : 'rgba(255,255,255,0.06)'}`,
                    backgroundColor: tone === t.value ? 'rgba(74,225,118,0.07)' : '#121314',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ color: tone === t.value ? '#4ae176' : '#fff', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{t.label}</div>
                  <div style={{ color: '#888', fontSize: '12px' }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Language */}
          <div style={{ marginBottom: '24px' }}>
            <label style={label}>Bot Reply Language</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { value: 'english', label: 'English', flag: '🇺🇸' },
                { value: 'roman_urdu', label: 'Roman Urdu', flag: '🇵🇰' },
                { value: 'arabic', label: 'Arabic', flag: '🇸🇦' },
              ].map(l => (
                <div
                  key={l.value}
                  onClick={() => setLanguage(l.value)}
                  style={{
                    flex: '1 1 100px',
                    padding: '14px',
                    borderRadius: '10px',
                    border: `1px solid ${language === l.value ? '#4ae176' : 'rgba(255,255,255,0.06)'}`,
                    backgroundColor: language === l.value ? 'rgba(74,225,118,0.07)' : '#121314',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{l.flag}</div>
                  <div style={{ color: language === l.value ? '#4ae176' : '#fff', fontWeight: 600, fontSize: '13px' }}>{l.label}</div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleSaveBot} disabled={savingBot} style={btn(savingBot)}>
            {savingBot ? 'Saving...' : 'Save Bot Settings'}
          </button>
        </motion.div>

        {/* Operating Hours */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Clock size={18} color="#4ae176" />
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Operating Hours</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {Object.entries(operatingHours).map(([day, hours]) => (
              <div key={day} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '12px 16px', borderRadius: '10px',
                backgroundColor: '#121314',
                border: '1px solid rgba(255,255,255,0.06)',
                flexWrap: 'wrap',
              }}>
                {/* Day + Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '120px' }}>
                  <div
                    onClick={() => setOperatingHours(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof prev], enabled: !hours.enabled } }))}
                    style={{
                      width: '40px', height: '22px', borderRadius: '999px',
                      backgroundColor: hours.enabled ? '#4ae176' : 'rgba(255,255,255,0.1)',
                      position: 'relative', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '3px',
                      left: hours.enabled ? '21px' : '3px',
                      width: '16px', height: '16px',
                      borderRadius: '50%', backgroundColor: '#fff',
                      transition: 'left 0.2s',
                    }} />
                  </div>
                  <span style={{ color: hours.enabled ? '#fff' : '#555', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>
                    {day.slice(0, 3).toUpperCase()}
                  </span>
                </div>

                {/* Time inputs */}
                {hours.enabled ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="time" value={hours.open}
                      onChange={e => setOperatingHours(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof prev], open: e.target.value } }))}
                      style={{ ...input, width: '120px', padding: '6px 10px' }}
                    />
                    <span style={{ color: '#555', fontSize: '12px' }}>to</span>
                    <input type="time" value={hours.close}
                      onChange={e => setOperatingHours(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof prev], close: e.target.value } }))}
                      style={{ ...input, width: '120px', padding: '6px 10px' }}
                    />
                  </div>
                ) : (
                  <span style={{ color: '#555', fontSize: '13px' }}>Closed</span>
                )}
              </div>
            ))}
          </div>

          <button onClick={handleSaveHours} disabled={savingHours} style={btn(savingHours)}>
            {savingHours ? 'Saving...' : 'Save Operating Hours'}
          </button>
        </motion.div>

        {/* Away Message */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <MessageSquare size={18} color="#4ae176" />
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Away Message</h3>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={label}>Message sent outside operating hours</label>
            <textarea
              value={awayMessage}
              onChange={e => setAwayMessage(e.target.value)}
              rows={3}
              placeholder="Abhi available nahi hain. Thori der baad contact karein..."
              style={{ ...input, resize: 'vertical', minHeight: '90px' }}
            />
          </div>
          <p style={{ color: '#555', fontSize: '12px', marginBottom: '20px' }}>
            Bot operating hours ke bahar ye message send karega automatically.
          </p>

          <button onClick={handleSaveAway} disabled={savingAway} style={btn(savingAway)}>
            {savingAway ? 'Saving...' : 'Save Away Message'}
          </button>
        </motion.div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </AppShell>
  )
}