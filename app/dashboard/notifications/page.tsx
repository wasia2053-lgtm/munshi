'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { motion } from 'framer-motion'
import EmptyState from '@/components/EmptyState'

interface Notification {
  id: string
  type: 'new_message' | 'credits_low' | 'credits_empty' | 'plan_upgrade' | 'login' | 'training_done'
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showRead, setShowRead] = useState(false)

  useEffect(() => {
    fetch('/api/notifications', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setNotifications(data.notifications || []); setLoading(false) })
  }, [])

  const handleCardClick = async (id: string) => {
    await fetch('/api/notifications/mark-read', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications/mark-read', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const getIcon = (type: string) => {
    const map: Record<string, { icon: string; color: string }> = {
      new_message: { icon: '💬', color: '#3B82F6' },
      credits_low: { icon: '⚠️', color: '#F59E0B' },
      credits_empty: { icon: '🚫', color: '#EF4444' },
      plan_upgrade: { icon: '⭐', color: '#4ae176' },
      login: { icon: '👤', color: '#4ae176' },
      training_done: { icon: '🧠', color: '#8B5CF6' },
    }
    return map[type] || { icon: '📢', color: '#666' }
  }

  const getTimeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    const day = Math.floor(diff / 86400000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    if (h < 24) return `${h}h ago`
    return `${day}d ago`
  }

  const filtered = showRead ? notifications : notifications.filter(n => !n.is_read)
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <AppShell>
      <div style={{ width: '100%', fontFamily: 'Geist, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 600 }}>Notifications</h1>
            <p style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>Account activity & updates</p>
          </div>
          <button
            onClick={handleMarkAllRead}
            style={{
              backgroundColor: 'transparent',
              color: '#4ae176',
              border: '1px solid rgba(74,225,118,0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Geist, sans-serif',
            }}
          >
            Mark all read
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[
            { label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`, val: false },
            { label: 'All', val: true },
          ].map(tab => (
            <button
              key={String(tab.val)}
              onClick={() => setShowRead(tab.val)}
              style={{
                padding: '6px 18px',
                borderRadius: '999px',
                backgroundColor: showRead === tab.val ? '#4ae176' : 'transparent',
                color: showRead === tab.val ? '#121314' : '#888',
                border: `1px solid ${showRead === tab.val ? '#4ae176' : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'Geist, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '72px', borderRadius: '12px', backgroundColor: '#1a1b1c', opacity: 0.5 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
            <p style={{ color: '#888', fontSize: '14px' }}>
              {showRead ? 'Koi notification nahi' : 'Koi unread notification nahi'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((n, i) => {
              const { icon, color } = getIcon(n.type)
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => !n.is_read && handleCardClick(n.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: n.is_read ? '#141516' : '#1a1b1c',
                    border: `1px solid ${n.is_read ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
                    cursor: n.is_read ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    backgroundColor: color + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', flexShrink: 0,
                  }}>
                    {icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: n.is_read ? '#888' : '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>
                      {n.title}
                    </div>
                    <div style={{ color: '#666', fontSize: '13px', lineHeight: '1.4' }}>
                      {n.message}
                    </div>
                  </div>

                  {/* Time + dot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                    <span style={{ color: '#555', fontSize: '12px' }}>{getTimeAgo(n.created_at)}</span>
                    {!n.is_read && (
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4ae176' }} />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}