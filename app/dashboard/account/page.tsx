'use client'
import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import Link from 'next/link'

export default function AccountPage() {
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/account/get')
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setName(data.name || '')
        setAvatarUrl(data.avatar_url || null)
      })
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('avatar', file)
    const res = await fetch('/api/account/upload-avatar', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) {
      setAvatarUrl(data.url)
      console.log('Avatar URL:', data.url)
      console.log('avatarUrl state:', avatarUrl)
    }
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/account/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar_url: avatarUrl })
    })
    setSaving(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const messagesPercent = profile ? (profile.messages_used / profile.messages_limit) * 100 : 0

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ color: '#F7E7CE', fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>
          Account
        </h1>
        <p style={{ color: '#8A7560', fontSize: '0.875rem', marginBottom: '32px' }}>
          Manage your profile and subscription
        </p>

        {/* Profile Card */}
        <div style={{
          backgroundColor: '#0D2420',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          border: '1px solid rgba(212,168,83,0.15)'
        }}>
          <h2 style={{ color: '#D4A853', fontSize: '1rem', fontWeight: '600', marginBottom: '24px' }}>
            Profile
          </h2>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: '80px', height: '80px', borderRadius: '50%',
                backgroundColor: '#102C26', border: '2px solid #D4A853',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', position: 'relative'
              }}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="avatar" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    borderRadius: '50%',
                    display: 'block'
                  }} 
                />
              ) : (
                <span style={{ color: '#D4A853', fontSize: '2rem', fontWeight: '700' }}>
                  {name?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
              <div style={{
                position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s'
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              >
                <span style={{ color: 'white', fontSize: '0.7rem' }}>Change</span>
              </div>
            </div>
            <div>
              <p style={{ color: '#F7E7CE', fontSize: '0.875rem', marginBottom: '4px' }}>
                {uploading ? 'Uploading...' : 'Click photo to change'}
              </p>
              <p style={{ color: '#8A7560', fontSize: '0.75rem' }}>JPG, PNG — max 2MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
          </div>

          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#8A7560', fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>
              Organization Name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px',
                backgroundColor: '#102C26', border: '1px solid rgba(212,168,83,0.2)',
                color: '#F7E7CE', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              backgroundColor: '#D4A853', color: '#102C26', border: 'none',
              borderRadius: '10px', padding: '12px 28px', fontWeight: '700',
              cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Plan Card */}
        <div style={{
          backgroundColor: '#0D2420', borderRadius: '16px', padding: '32px',
          marginBottom: '24px', border: '1px solid rgba(212,168,83,0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#D4A853', fontSize: '1rem', fontWeight: '600', marginBottom: '24px' }}>Plan & Usage</h2>
            <span style={{
              backgroundColor: 'rgba(212,168,83,0.15)', color: '#D4A853',
              padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600'
            }}>
              FREE PLAN
            </span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#8A7560', fontSize: '0.875rem' }}>Messages this month</span>
              <span style={{ color: '#D4A853', fontSize: '0.875rem', fontWeight: '600' }}>
                {profile?.messages_used || 0} / {profile?.messages_limit || 500}
              </span>
            </div>
            <div style={{ backgroundColor: '#102C26', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                backgroundColor: '#D4A853', height: '100%', borderRadius: '4px',
                width: `${Math.min(messagesPercent, 100)}%`, transition: 'width 0.3s'
              }} />
            </div>
            <p style={{ color: '#8A7560', fontSize: '0.75rem', marginTop: '6px' }}>
              {(profile?.messages_limit || 500) - (profile?.messages_used || 0)} messages remaining
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(212,168,83,0.15)', color: '#D4A853',
            padding: '20px', border: '1px solid rgba(212,168,83,0.2)', marginTop: '20px'
          }}>
            <p style={{ color: '#F7E7CE', fontWeight: '600', marginBottom: '4px' }}>Upgrade to Growth</p>
            <p style={{ color: '#8A7560', fontSize: '0.875rem', marginBottom: '16px' }}>
              5,000 messages · Analytics · Priority support
            </p>
            <button style={{
              backgroundColor: '#D4A853', color: '#102C26', border: 'none',
              borderRadius: '8px', padding: '10px 24px', fontWeight: '700',
              cursor: 'pointer', width: '100%', fontSize: '0.9rem'
            }}>
              Upgrade — PKR 7,000/mo
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{
          backgroundColor: '#0D2420', borderRadius: '16px', padding: '32px',
          border: '1px solid rgba(255,80,80,0.2)'
        }}>
          <h2 style={{ color: '#ff5050', fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>
            Danger Zone
          </h2>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              backgroundColor: 'transparent', color: '#ff5050',
              border: '1px solid rgba(255,80,80,0.3)', borderRadius: '8px',
              padding: '10px 20px', cursor: 'pointer', fontSize: '0.875rem'
            }}
          >
            Delete Account
          </button>
        </div>

        {/* Success Modal */}
        {showSuccess && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#102C26', border: '1px solid #D4A853',
              borderRadius: '16px', padding: '40px 48px', textAlign: 'center', maxWidth: '360px'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
              <h3 style={{ color: '#F7E7CE', fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
                Profile Updated!
              </h3>
              <p style={{ color: '#D4A853', fontSize: '0.875rem', marginBottom: '24px' }}>
                Your account has been saved successfully
              </p>
              <button
                onClick={() => setShowSuccess(false)}
                style={{
                  backgroundColor: '#D4A853', color: '#102C26', border: 'none',
                  borderRadius: '8px', padding: '10px 32px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#102C26', border: '1px solid rgba(255,80,80,0.3)',
              borderRadius: '16px', padding: '40px 48px', textAlign: 'center', maxWidth: '380px'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
              <h3 style={{ color: '#F7E7CE', fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
                Delete Account?
              </h3>
              <p style={{ color: '#8A7560', fontSize: '0.875rem', marginBottom: '24px' }}>
                This will permanently delete all your data, conversations, and training. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    backgroundColor: 'transparent', color: '#F7E7CE',
                    border: '1px solid rgba(247,231,206,0.2)', borderRadius: '8px',
                    padding: '10px 24px', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button style={{
                  backgroundColor: '#ff5050', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: '600'
                }}>
                  Delete Everything
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
