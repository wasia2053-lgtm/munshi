'use client'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'

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

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications')
    const data = await res.json()
    setNotifications(data.notifications || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleCardClick = async (id: string) => {
    await fetch('/api/notifications/mark-read', { method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ id })
    })
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    ))
  }

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications/mark-read', { method: 'POST', 
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({}) 
    })
    // Update local state immediately — no refetch needed
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const getIcon = (type: string) => {
    const iconMap: Record<string, { icon: string; color: string }> = {
      new_message: { icon: '💬', color: '#3B82F6' },
      credits_low: { icon: '⚠️', color: '#F59E0B' },
      credits_empty: { icon: '🚫', color: '#EF4444' },
      plan_upgrade: { icon: '⭐', color: '#D4A853' },
      login: { icon: '👤', color: '#10B981' },
      training_done: { icon: '🧠', color: '#8B5CF6' }
    }
    return iconMap[type] || { icon: '📢', color: '#6B7280' }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  return (
    <DashboardLayout title="Notifications" subtitle="Aapke account ki updates">
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ color: '#F7E7CE', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
            Notifications
          </h1>
          <button
            onClick={handleMarkAllRead}
            style={{
              backgroundColor: 'transparent',
              color: '#D4A853',
              border: '1px solid #D4A853',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#D4A853'
              e.currentTarget.style.color = '#102C26'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#D4A853'
            }}
          >
            Mark all read
          </button>
        </div>

        {/* Filter Toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setShowRead(false)}
            style={{ 
              padding: '6px 16px', borderRadius: '20px',
              background: !showRead ? '#D4A853' : 'transparent',
              color: !showRead ? '#102C26' : '#D4A853',
              border: '1px solid #D4A853', cursor: 'pointer', fontWeight: 600
            }}>
            Unread {notifications.filter(n => !n.is_read).length > 0 ? `(${notifications.filter(n => !n.is_read).length})` : ''}
          </button>
          <button onClick={() => setShowRead(true)}
            style={{
              padding: '6px 16px', borderRadius: '20px',
              background: showRead ? '#D4A853' : 'transparent',
              color: showRead ? '#102C26' : '#D4A853',
              border: '1px solid #D4A853', cursor: 'pointer', fontWeight: 600
            }}>
            All
          </button>
        </div>

        {/* Notification List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8A7560' }}>
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#8A7560' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔔</div>
            <div style={{ fontSize: '1.125rem', marginBottom: '8px' }}>Koi notification nahi</div>
            <div style={{ fontSize: '0.875rem', color: '#6B5A4A' }}>
              Jab koi update hogi to yahan dikhegi
            </div>
          </div>
        ) : (
          <>
            {notifications.filter(n => !n.is_read).length === 0 && !showRead && (
              <div style={{ textAlign: 'center', color: '#D4A853', marginTop: '60px' }}>
                <div style={{ fontSize: '40px' }}>🔔</div>
                <p>Koi unread notification nahi</p>
              </div>
            )}
            
            {(showRead ? notifications : notifications.filter(n => !n.is_read)).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(showRead ? notifications : notifications.filter(n => !n.is_read)).map((notification) => {
              const iconData = getIcon(notification.type)
              return (
                <div
                  key={notification.id}
                  onClick={() => !notification.is_read && handleCardClick(notification.id)}
                  style={{
                    backgroundColor: notification.is_read ? '#0D2420' : '#1A3D35',
                    border: '1px solid rgba(212,168,83,0.15)',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: notification.is_read ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                  onMouseOver={(e) => {
                    if (!notification.is_read) {
                      e.currentTarget.style.backgroundColor = '#2A4A42'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!notification.is_read) {
                      e.currentTarget.style.backgroundColor = '#1A3D35'
                    }
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    fontSize: '1.5rem',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: iconData.color + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {iconData.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: '#F7E7CE',
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>
                      {notification.title}
                    </div>
                    <div style={{
                      color: '#8A7560',
                      fontSize: '0.875rem',
                      lineHeight: '1.4'
                    }}>
                      {notification.message}
                    </div>
                  </div>

                  {/* Time + Unread Dot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ color: '#6B5A4A', fontSize: '0.75rem' }}>
                      {getTimeAgo(notification.created_at)}
                    </div>
                    {!notification.is_read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#D4A853'
                      }} />
                    )}
                  </div>
                </div>
              )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
