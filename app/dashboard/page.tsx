'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { SkeletonCard } from '@/components/SkeletonLoader'
import {
  MessageSquare, Users, BookOpen, Zap,
  Brain, BarChart2, Settings, Bell,
  TrendingUp, ChevronRight, Send, Bot
} from 'lucide-react'

type RecentConv = {
  id: string
  customer_phone: string
  updated_at: string
  lastMessage: string
}

type Stats = {
  totalMessages: number
  totalConversations: number
  trainingCount: number
  responseRate: number
  messagesUsed: number
  messagesLimit: number
}

type Activity = {
  id: string
  title: string
  type: string
  created_at: string
}

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatDate() {
  return new Date().toLocaleDateString('en-PK', {
    weekday: 'long', year: 'numeric',
    month: 'long', day: 'numeric'
  })
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [stats, setStats] = useState<Stats>({
    totalMessages: 0, totalConversations: 0,
    trainingCount: 0, responseRate: 0,
    messagesUsed: 0, messagesLimit: 50,
  })
  const [recentConvs, setRecentConvs] = useState<RecentConv[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [userName, setUserName] = useState('Wasi')
  const [loading, setLoading] = useState(true)
  const [testMessage, setTestMessage] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [testLoading, setTestLoading] = useState(false)

  useEffect(() => { fetchDashboardData() }, [])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Get org name
      const { data: settings } = await supabase
        .from('business_settings')
        .select('organization_name, bot_name')
        .eq('business_id', user.id)
        .single()
      if (settings?.organization_name) setUserName(settings.organization_name)

      // Conversations
      const { data: convs, count: convCount } = await supabase
        .from('conversations')
        .select('id, customer_phone, updated_at, last_message', { count: 'exact' })
        .eq('business_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5)

      const convIds = (convs || []).map(c => c.id)

      // Messages
      let totalMessages = 0
      let botMessages = 0
      if (convIds.length > 0) {
        const { count: msgCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', convIds)
        totalMessages = msgCount || 0

        const { count: botCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', convIds)
          .eq('sender', 'bot')
        botMessages = botCount || 0
      }

      // Training count
      const { count: trainingCount } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', user.id)

      // Recent convs with last message
      const convsWithMsg: RecentConv[] = await Promise.all(
        (convs || []).map(async (conv) => {
          const { data: msgs } = await supabase
            .from('messages')
            .select('content, timestamp')
            .eq('conversation_id', conv.id)
            .order('timestamp', { ascending: false })
            .limit(1)
          return {
            id: conv.id,
            customer_phone: conv.customer_phone,
            updated_at: conv.updated_at,
            lastMessage: msgs?.[0]?.content || conv.last_message || 'No messages',
          }
        })
      )

      // Activities
      const { data: notifs } = await supabase
        .from('notifications')
        .select('id, title, type, created_at')
        .eq('business_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6)

      const responseRate = totalMessages > 0
        ? Math.round((botMessages / totalMessages) * 100)
        : 0

        // Fetch billing info for dynamic message limit
        const billingRes = await fetch('/api/billing/current', {
          credentials: 'include'
        })
        const billingData = await billingRes.json()
        const messagesLimit = billingData?.messages_limit ?? 50

        setStats({
          totalMessages,
          totalConversations: convCount || 0,
          trainingCount: trainingCount || 0,
          responseRate,
          messagesUsed: billingData?.messages_used ?? botMessages,
          messagesLimit: billingData?.messages_limit ?? 50,
        })
      setRecentConvs(convsWithMsg)
      setActivities(notifs || [])
    } catch (e) {
      console.error('Dashboard error:', e)
    }
    setLoading(false)
  }

  async function handleTestAI() {
    if (!testMessage.trim()) return
    setTestLoading(true)
    setTestResponse('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage }),
      })
      const data = await res.json()
      setTestResponse(data.response || data.error || 'No response')
    } catch {
      setTestResponse('Error connecting to AI')
    }
    setTestLoading(false)
  }

  const usedPct = Math.min(Math.round((stats.messagesUsed / stats.messagesLimit) * 100), 100)

  const statCards = [
    {
      icon: MessageSquare,
      label: 'Total Messages',
      value: loading ? '—' : stats.totalMessages,
      sub: 'All time',
      trend: '+Real data',
    },
    {
      icon: Users,
      label: 'Conversations',
      value: loading ? '—' : stats.totalConversations,
      sub: 'Unique customers',
      trend: 'Active',
    },
    {
      icon: BookOpen,
      label: 'Training Sources',
      value: loading ? '—' : stats.trainingCount,
      sub: 'Knowledge base',
      trend: 'Trained',
    },
    {
      icon: Zap,
      label: 'Response Rate',
      value: loading ? '—' : `${stats.responseRate}%`,
      sub: 'Bot vs total',
      trend: 'Automated',
    },
  ]

  const quickActions = [
    { icon: Brain, label: 'Train My Bot', path: '/dashboard/training', gold: true },
    { icon: MessageSquare, label: 'View Conversations', path: '/dashboard/conversations', gold: false },
    { icon: BarChart2, label: 'Analytics', path: '/dashboard/analytics', gold: false },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings', gold: false },
  ]

  const activityIcon: Record<string, string> = {
    new_message: '💬',
    training_complete: '🎓',
    credits_low: '⚠️',
  }

  return (
    <DashboardLayout title="Dashboard" subtitle="">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .fade-up-1 { animation-delay: 0.05s; opacity: 0; }
        .fade-up-2 { animation-delay: 0.1s; opacity: 0; }
        .fade-up-3 { animation-delay: 0.15s; opacity: 0; }
        .fade-up-4 { animation-delay: 0.2s; opacity: 0; }
        .fade-up-5 { animation-delay: 0.25s; opacity: 0; }
      `}</style>

      {/* ── GREETING ── */}
      <div className="fade-up fade-up-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-6">
        <div>
          <h1 style={{ color: '#F7E7CE', fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
            Assalam o Alaikum, {userName}! 👋
          </h1>
          <p style={{ color: '#8A7560', fontSize: '0.85rem', marginTop: 4 }}>
            Yeh hai aaj ka aapka business overview
          </p>
        </div>
        <span style={{ color: '#8A7560', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          {formatDate()}
        </span>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div
              key={i}
              className={`fade-up fade-up-${i + 1}`}
              style={{
                background: '#0a1f1b',
                border: '1px solid #2A4A42',
                borderRadius: 12,
                padding: '18px 16px',
                transition: 'border-color 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,168,83,0.35)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2A4A42')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ background: 'rgba(212,168,83,0.1)', borderRadius: 8, padding: 7 }}>
                  <Icon size={16} color="#D4A853" />
                </div>
                <span style={{ color: '#8A7560', fontSize: '0.7rem' }}>{card.sub}</span>
              </div>
              <div style={{ color: '#D4A853', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>
                {card.value}
              </div>
              <div style={{ color: '#8A7560', fontSize: '0.72rem', marginTop: 6 }}>{card.label}</div>
              <div style={{ color: '#4CAF82', fontSize: '0.68rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                <TrendingUp size={10} /> {card.trend}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* LEFT — 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Recent Conversations */}
          <div
            className="fade-up fade-up-3"
            style={{ background: '#0a1f1b', border: '1px solid #2A4A42', borderRadius: 12, padding: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: '#F7E7CE', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                Recent Conversations
              </h3>
              <button
                onClick={() => router.push('/dashboard/conversations')}
                style={{ color: '#D4A853', fontSize: '0.78rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
              >
                View All <ChevronRight size={13} />
              </button>
            </div>

            {loading ? (
              <SkeletonCard lines={3} />
            ) : recentConvs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#8A7560' }}>
                <Users size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontSize: '0.82rem' }}>Koi conversations nahi abhi tak</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2A4A42' }}>
                      {['Customer', 'Last Message', 'Time'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#8A7560', fontWeight: 500, fontSize: '0.72rem' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentConvs.map(conv => (
                      <tr
                        key={conv.id}
                        onClick={() => router.push('/dashboard/conversations')}
                        style={{ borderBottom: '1px solid rgba(42,74,66,0.5)', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,83,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 10px', color: '#F7E7CE', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {conv.customer_phone}
                        </td>
                        <td style={{ padding: '10px 10px', color: '#C4A882', maxWidth: 180 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {conv.lastMessage}
                          </div>
                        </td>
                        <td style={{ padding: '10px 10px', color: '#8A7560', whiteSpace: 'nowrap' }}>
                          {timeAgo(conv.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Test AI Chat */}
          <div
            className="fade-up fade-up-4"
            style={{ background: '#0a1f1b', border: '1px solid #2A4A42', borderRadius: 12, padding: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Bot size={16} color="#D4A853" />
              <h3 style={{ color: '#F7E7CE', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                Test AI Chat
              </h3>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTestAI()}
                placeholder="Bot ko kuch poochho..."
                style={{
                  flex: 1, background: '#102C26', border: '1px solid #2A4A42',
                  borderRadius: 8, padding: '10px 14px', color: '#F7E7CE',
                  fontSize: '0.85rem', outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(212,168,83,0.5)')}
                onBlur={e => (e.target.style.borderColor = '#2A4A42')}
              />
              <button
                onClick={handleTestAI}
                disabled={testLoading || !testMessage.trim()}
                style={{
                  background: testLoading || !testMessage.trim() ? '#2A4A42' : '#D4A853',
                  color: '#0a1f1b', border: 'none', borderRadius: 8,
                  padding: '10px 16px', cursor: testLoading || !testMessage.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
                  fontSize: '0.83rem', transition: 'background 0.2s',
                }}
              >
                <Send size={14} />
                {testLoading ? 'Testing...' : 'Test'}
              </button>
            </div>
            {testResponse && (
              <div style={{
                marginTop: 12, background: '#102C26', border: '1px solid #2A4A42',
                borderRadius: 8, padding: 14,
              }}>
                <div style={{ color: '#8A7560', fontSize: '0.72rem', marginBottom: 6 }}>🤖 Bot ka jawab:</div>
                <div style={{ color: '#F7E7CE', fontSize: '0.85rem', lineHeight: 1.6 }}>{testResponse}</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — 1 col */}
        <div className="flex flex-col gap-4">

          {/* Plan Usage */}
          <div
            className="fade-up fade-up-3"
            style={{ background: '#0a1f1b', border: '1px solid #2A4A42', borderRadius: 12, padding: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ color: '#F7E7CE', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>Plan Usage</h3>
              <span style={{
                background: 'rgba(212,168,83,0.12)', color: '#D4A853',
                fontSize: '0.68rem', padding: '3px 8px', borderRadius: 20,
                border: '1px solid rgba(212,168,83,0.25)', fontWeight: 600,
              }}>
                FREE
              </span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#8A7560', fontSize: '0.78rem' }}>Messages this month</span>
                <span style={{ color: '#D4A853', fontSize: '0.78rem', fontWeight: 600 }}>
                  {loading ? '—' : `${stats.messagesUsed} / ${stats.messagesLimit}`}
                </span>
              </div>
              <div style={{ height: 6, background: '#2A4A42', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${usedPct}%`,
                  background: 'linear-gradient(90deg, #D4A853, #F0C96A)',
                  borderRadius: 99, transition: 'width 0.8s ease',
                }} />
              </div>
              <p style={{ color: '#8A7560', fontSize: '0.72rem', marginTop: 6 }}>
                {loading ? '' : `${stats.messagesLimit - stats.messagesUsed} messages remaining`}
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/billing')}
              style={{
                width: '100%', background: 'linear-gradient(135deg, #D4A853, #C4983F)',
                color: '#0D2420', border: 'none', borderRadius: 8, padding: '10px 0',
                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              ✨ Upgrade to Growth — PKR 7,000/mo
            </button>
          </div>

          {/* Quick Actions */}
          <div
            className="fade-up fade-up-4"
            style={{ background: '#0a1f1b', border: '1px solid #2A4A42', borderRadius: 12, padding: 20 }}
          >
            <h3 style={{ color: '#F7E7CE', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 14px' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickActions.map((action, i) => {
                const Icon = action.icon
                return (
                  <button
                    key={i}
                    onClick={() => router.push(action.path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', background: 'none', textAlign: 'left',
                      border: `1px solid ${action.gold ? 'rgba(212,168,83,0.4)' : '#2A4A42'}`,
                      borderRadius: 8, padding: '10px 14px',
                      color: action.gold ? '#D4A853' : '#C4A882',
                      fontSize: '0.83rem', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(212,168,83,0.06)'
                      e.currentTarget.style.borderColor = 'rgba(212,168,83,0.4)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'none'
                      e.currentTarget.style.borderColor = action.gold ? 'rgba(212,168,83,0.4)' : '#2A4A42'
                    }}
                  >
                    <Icon size={15} />
                    {action.label}
                    <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div
            className="fade-up fade-up-5"
            style={{ background: '#0a1f1b', border: '1px solid #2A4A42', borderRadius: 12, padding: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Bell size={15} color="#D4A853" />
              <h3 style={{ color: '#F7E7CE', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                Recent Activity
              </h3>
            </div>
            {loading ? (
              <SkeletonCard lines={3} />
            ) : activities.length === 0 ? (
              <p style={{ color: '#8A7560', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>
                Koi activity nahi abhi
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activities.map(act => (
                  <div
                    key={act.id}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(212,168,83,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontSize: '0.75rem',
                    }}>
                      {activityIcon[act.type] || '🔔'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#F7E7CE', fontSize: '0.78rem', margin: 0, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {act.title}
                      </p>
                      <p style={{ color: '#8A7560', fontSize: '0.68rem', margin: '2px 0 0' }}>
                        {timeAgo(act.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}