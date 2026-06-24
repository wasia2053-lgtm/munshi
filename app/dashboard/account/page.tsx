'use client'
import { useState, useEffect, useRef } from 'react'
import { AppShell } from '@/components/app-shell'
import { motion } from 'framer-motion'
import { Camera, LogOut, Crown } from 'lucide-react'
import Toast from '@/components/Toast'
import { createClient } from '@/lib/supabase/client'

export default function AccountPage() {
  const [profile, setProfile] = useState<any>(null)
  const [orgName, setOrgName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const cached = localStorage.getItem('munshi_profile')
    if (cached) {
      const p = JSON.parse(cached)
      setOrgName(p.name || '')
      setAvatarUrl(p.avatar_url || null)
    }

    fetch('/api/account/get', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data)
        setOrgName(data.name || '')
        setAvatarUrl(data.avatar_url || null)
        localStorage.setItem(
          'munshi_profile',
          JSON.stringify({ name: data.name || '', avatar_url: data.avatar_url || null })
        )
      })
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('avatar', file)
    const res = await fetch('/api/account/upload-avatar', { method: 'POST', credentials: 'include', body: formData })
    const data = await res.json()
    if (data.avatar_url) {
      setAvatarUrl(data.avatar_url)
      await fetch('/api/account/update', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: data.avatar_url }),
      })
      localStorage.setItem('munshi_profile', JSON.stringify({ name: orgName, avatar_url: data.avatar_url }))
      localStorage.setItem('avatarUrl', data.avatar_url)
      window.dispatchEvent(new Event('avatarUpdated'))
      window.dispatchEvent(new Event('munshi_profile_updated'))
      window.dispatchEvent(new CustomEvent('account-updated'))
    }
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/account/update', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: orgName }),
    })
    setSaving(false)
    if (res.ok) {
      localStorage.setItem('munshi_profile', JSON.stringify({ name: orgName, avatar_url: avatarUrl }))
      window.dispatchEvent(new Event('munshi_profile_updated'))
      setToast({ message: 'Account save ho gayi! ✅', type: 'success' })
    } else {
      setToast({ message: 'Kuch masla hua, dobara try karo ❌', type: 'error' })
    }
    setTimeout(() => setToast(null), 3000)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleUpgradeContact = () => {
    const plan = profile?.plan || 'Growth'
    const msg = encodeURIComponent(`Hi, I want to upgrade my Munshi plan to ${plan}.`)
    window.open(`https://wa.me/923282847607?text=${msg}`, '_blank')
  }

  const messagesUsed = profile?.messages_used || 0
  const messagesLimit = profile?.messages_limit || 50
  const messagesPercent = Math.min((messagesUsed / messagesLimit) * 100, 100)
  const planName = profile?.plan ? profile.plan.toUpperCase() : 'FREE'

  return (
    <AppShell>
      <div style={{ width: '100%', fontFamily: 'Geist, sans-serif', maxWidth: '720px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 600 }}>Account</h1>
          <p style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>Manage your profile and subscription</p>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
          style={{
            backgroundColor: '#1a1b1c',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Profile</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              {avatarUrl && avatarUrl !== 'NULL' && avatarUrl !== 'null' ? (
                <img src={avatarUrl} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(74, 225, 118, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                    fontWeight: 700,
                    color: '#4ae176',
                  }}
                >
                  {orgName?.charAt(0)?.toUpperCase() || 'M'}
                </div>
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <Camera size={18} color="#fff" />
              </div>
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: '14px', marginBottom: '4px' }}>
                {uploading ? 'Uploading...' : 'Click photo to change'}
              </p>
              <p style={{ color: '#888', fontSize: '12px' }}>JPG, PNG — max 2MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#888', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
              Organization Name
            </label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#121314',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'Geist, sans-serif',
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              backgroundColor: '#4ae176',
              color: '#121314',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 24px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'Geist, sans-serif',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </motion.div>

        {/* Plan & Usage Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          style={{
            backgroundColor: '#1a1b1c',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Plan & Usage</h3>
            <span
              style={{
                backgroundColor: 'rgba(74, 225, 118, 0.1)',
                color: '#4ae176',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {planName} PLAN
            </span>
          </div>

          <div style={{ marginBottom: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#888', fontSize: '13px' }}>Messages this month</span>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {messagesUsed} / {messagesLimit}
              </span>
            </div>
            <div style={{ backgroundColor: '#121314', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${messagesPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ backgroundColor: '#4ae176', height: '100%', borderRadius: '4px' }}
              />
            </div>
            <p style={{ color: '#888', fontSize: '12px', marginTop: '6px' }}>
              {Math.max(messagesLimit - messagesUsed, 0)} messages remaining
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(74, 225, 118, 0.06)',
              border: '1px solid rgba(74, 225, 118, 0.15)',
              borderRadius: '12px',
              padding: '20px',
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(74, 225, 118, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Crown size={16} color="#4ae176" />
            </div>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>Need more messages?</p>
              <p style={{ color: '#888', fontSize: '13px' }}>Upgrade for higher limits, analytics & priority support.</p>
            </div>
            <button
              onClick={handleUpgradeContact}
              style={{
                backgroundColor: '#4ae176',
                color: '#121314',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
            >
              Contact us to Upgrade
            </button>
          </div>
        </motion.div>

        {/* Logout Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.16 }}
          style={{
            backgroundColor: '#1a1b1c',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              width: '100%',
              fontFamily: 'Geist, sans-serif',
            }}
          >
            <LogOut size={15} />
            Log Out
          </button>
        </motion.div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </AppShell>
  )
}