"use client"
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { SkeletonCard, SkeletonLine } from '@/components/SkeletonLoader'
import EmptyState from '@/components/EmptyState'

interface DashboardStats {
  organizationName: string
  whatsappStatus: string
  plan: string
  messagesUsed: number
  messagesLimit: number
  totalMessagesThisMonth: number
  messagesChangePercent: number | null
  activeLeadsThisMonth: number
  avgResponseSeconds: number | null
  volumeLast7Days: { day: string; count: number }[]
  recentConversations: { id: string; name: string; lastMessage: string; time: string | null }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const formatResponseTime = (seconds: number | null) => {
    if (seconds === null) return '—'
    if (seconds < 60) return `${Math.round(seconds)}s`
    return `${(seconds / 60).toFixed(1)}m`
  }

  const formatTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return ''
    const diff = Date.now() - new Date(timestamp).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const maxCount = stats ? Math.max(...stats.volumeLast7Days.map(d => d.count), 1) : 1

  return (
    <DashboardLayout>
      <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 sticky top-0 bg-[#121314]/50 backdrop-blur-md z-30">
        <h1 className="font-headline-md text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
            stats?.whatsappStatus === 'connected'
              ? 'bg-[#4ae176]/10 border-[#4ae176]/20'
              : 'bg-white/5 border-white/10'
          }`}>
            <div className={`w-2 h-2 rounded-full ${stats?.whatsappStatus === 'connected' ? 'bg-[#4ae176] animate-pulse' : 'bg-white/30'}`} />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${stats?.whatsappStatus === 'connected' ? 'text-[#4ae176]' : 'text-white/40'}`}>
              {stats?.whatsappStatus === 'connected' ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
            </span>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-[1280px] mx-auto">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {loading ? (
            <>
              <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
            </>
          ) : (
            <>
              <StatCard
                icon="chat_bubble"
                label="Total Messages"
                value={stats!.totalMessagesThisMonth.toLocaleString()}
                badge={stats!.messagesChangePercent !== null
                  ? `${stats!.messagesChangePercent >= 0 ? '+' : ''}${stats!.messagesChangePercent}%`
                  : 'New'}
                badgeColor={stats!.messagesChangePercent === null || stats!.messagesChangePercent >= 0 ? 'text-[#4ae176]' : 'text-red-400'}
              />
              <StatCard
                icon="group"
                label="Active Leads"
                value={stats!.activeLeadsThisMonth.toLocaleString()}
                badge="This month"
                badgeColor="text-white/40"
              />
              <StatCard
                icon="bolt"
                label="Avg Response Time"
                value={formatResponseTime(stats!.avgResponseSeconds)}
                badge={stats!.avgResponseSeconds !== null ? 'Live' : 'No data'}
                badgeColor="text-[#4ae176]"
              />
              <div className="glass-panel p-6 rounded-2xl bg-[#4ae176]/5 border-[#4ae176]/20 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined text-[#4ae176]">hub</span>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    stats!.whatsappStatus === 'connected' ? 'bg-[#4ae176] text-[#121314]' : 'bg-white/10 text-white/50'
                  }`}>
                    {stats!.whatsappStatus === 'connected' ? 'LIVE' : 'OFFLINE'}
                  </div>
                </div>
                <div className="font-label-caps text-xs text-[#4ae176]/80 mb-1 uppercase tracking-wide">WhatsApp Node</div>
                <div className="text-xl text-white font-bold capitalize">{stats!.whatsappStatus}</div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Volume Chart */}
          <div className="lg:col-span-2 glass-panel p-8 rounded-3xl min-h-[400px] flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl text-white font-bold">Volume Insight</h3>
              <p className="text-sm text-white/50">Message distribution across last 7 days</p>
            </div>
            {loading ? (
              <SkeletonLine />
            ) : (
              <>
                <div className="flex-1 w-full flex items-end justify-between gap-3">
                  {stats!.volumeLast7Days.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full relative flex items-end" style={{ height: '280px' }}>
                        <div
                          className={`w-full rounded-t-lg transition-all ${d.count === maxCount && d.count > 0 ? 'bg-[#4ae176]' : 'bg-white/10 group-hover:bg-[#4ae176]/40'}`}
                          style={{ height: `${Math.max((d.count / maxCount) * 100, 2)}%` }}
                        >
                          <div className="text-center -mt-6 text-[10px] font-bold text-[#4ae176] opacity-0 group-hover:opacity-100 transition-opacity">
                            {d.count}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 px-1 text-[10px] text-white/30 font-mono">
                  {stats!.volumeLast7Days.map((d, i) => <span key={i}>{d.day}</span>)}
                </div>
              </>
            )}
          </div>

          {/* Recent Conversations */}
          <div className="glass-panel p-8 rounded-3xl flex flex-col">
            <h3 className="text-lg text-white font-bold mb-6">Recent Conversations</h3>
            {loading ? (
              <SkeletonLine />
            ) : stats!.recentConversations.length === 0 ? (
              <EmptyState
                icon="forum"
                title="No conversations yet"
                description="Once customers message your WhatsApp, they'll show up here."
              />
            ) : (
              <div className="space-y-6 flex-1 overflow-y-auto">
                {stats!.recentConversations.map(c => (
                  <a key={c.id} href={`/dashboard/conversations?id=${c.id}`} className="flex gap-4 group cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/5 group-hover:border-[#4ae176]/30">
                      <span className="material-symbols-outlined text-[#4ae176] text-lg">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-sm font-bold text-white truncate">{c.name}</span>
                        <span className="text-[10px] text-white/40 flex-shrink-0 ml-2">{formatTimeAgo(c.time)}</span>
                      </div>
                      <p className="text-xs text-white/50 truncate">{c.lastMessage}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
            <a href="/dashboard/conversations" className="w-full py-4 mt-6 border border-white/10 rounded-xl text-xs font-semibold text-center uppercase tracking-wide hover:bg-white/5 transition-all block">
              View All Activity
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function StatCard({ icon, label, value, badge, badgeColor }: {
  icon: string; label: string; value: string; badge: string; badgeColor: string
}) {
  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <span className="material-symbols-outlined text-[#4ae176] opacity-80">{icon}</span>
        <span className={`text-xs font-bold ${badgeColor}`}>{badge}</span>
      </div>
      <div className="text-xs text-white/50 mb-1 uppercase tracking-wide">{label}</div>
      <div className="text-3xl text-white font-bold tracking-tight">{value}</div>
    </div>
  )
}