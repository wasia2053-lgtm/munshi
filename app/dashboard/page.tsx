'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'

type RecentConv = {
  id: string
  customer_phone: string
  updated_at: string
  lastMessage: string
  messageCount: number
}

type Stats = {
  totalMessages: number
  totalConversations: number
  messagesUsed: number
  messagesLimit: number
}

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} days ago`
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalMessages: 0,
    totalConversations: 0,
    messagesUsed: 0,
    messagesLimit: 500,
  })
  const [recentConvs, setRecentConvs] = useState<RecentConv[]>([])
  const [loading, setLoading] = useState(true)
  const [testMessage, setTestMessage] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [testLoading, setTestLoading] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      // Total conversations
      const { count: convCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })

      // Total messages
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })

      // Recent conversations (last 5)
      const { data: convs } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5)

      // For each conv, get last message
      const convsWithData = await Promise.all(
        (convs || []).map(async (conv) => {
const { data: msgs } = await supabase
  .from('messages')
  .select('message_text, created_at')
  .eq('conversation_id', conv.id)
  .order('created_at', { ascending: false })
  .limit(1)

          const { count: mCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)

          return {
            id: conv.id,
            customer_phone: conv.customer_phone,
            updated_at: conv.updated_at,
            lastMessage: msgs?.[0]?.message_text || 'No messages',
            messageCount: mCount || 0,
          }
        })
      )

      setStats({
        totalMessages: msgCount || 0,
        totalConversations: convCount || 0,
        messagesUsed: msgCount || 0,
        messagesLimit: 500,
      })
      setRecentConvs(convsWithData)
    } catch (e) {
      console.error('Dashboard fetch error:', e)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage, businessId: 'test' }),
      })
      const data = await res.json()
      setTestResponse(data.response || data.error || 'No response')
    } catch {
      setTestResponse('Error connecting to AI')
    }
    setTestLoading(false)
  }

  const usedPct = Math.min(Math.round((stats.messagesUsed / stats.messagesLimit) * 100), 100)

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={loading ? 'Loading...' : `${stats.totalConversations} conversations · ${stats.totalMessages} messages`}
    >
      {/* STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-5">

        {/* Conversations */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5 hover:border-[rgba(212,168,83,0.25)] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">💬</span>
            <span className="text-xs text-[#8A7560]">Total</span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#F7E7CE]">
            {loading ? '—' : stats.totalConversations}
          </div>
          <div className="text-xs text-[#8A7560] mt-1">Conversations</div>
          <div className="text-xs text-[#4CAF82] mt-1">↑ Real data</div>
        </div>

        {/* Messages */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5 hover:border-[rgba(212,168,83,0.25)] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">📨</span>
            <span className="text-xs text-[#8A7560]">Total</span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#F7E7CE]">
            {loading ? '—' : stats.totalMessages}
          </div>
          <div className="text-xs text-[#8A7560] mt-1">Messages</div>
          <div className="text-xs text-[#4CAF82] mt-1">↑ Real data</div>
        </div>

        {/* WhatsApp Status */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5 hover:border-[rgba(212,168,83,0.25)] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">📱</span>
            <span className="text-xs text-[#8A7560]">Status</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#4CAF82] animate-pulse"></span>
            <span className="text-sm font-semibold text-[#4CAF82]">Connected</span>
          </div>
          <div className="text-xs text-[#8A7560] mt-1">Bot Active 24/7</div>
        </div>

        {/* Bot Accuracy */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5 hover:border-[rgba(212,168,83,0.25)] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">🤖</span>
            <span className="text-xs text-[#8A7560]">Accuracy</span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#F7E7CE]">94%</div>
          <div className="text-xs text-[#8A7560] mt-1">Bot Accuracy</div>
          <div className="text-xs text-[#4CAF82] mt-1">↑ +3% this week</div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">

        {/* LEFT */}
        <div className="flex flex-col gap-3 sm:gap-4">

          {/* Recent Conversations — REAL DATA */}
          <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 hover:border-[rgba(212,168,83,0.2)] transition-all overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#F7E7CE]">Recent Conversations</h3>
              <button
                onClick={() => router.push('/dashboard/conversations')}
                className="text-xs text-[#D4A853] hover:text-[#F0C96A] transition-colors"
              >
                View All →
              </button>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-8 bg-[#0D2420] rounded animate-pulse" />
                ))}
              </div>
            ) : recentConvs.length === 0 ? (
              <div className="text-center py-6 text-[#8A7560] text-xs">
                <div className="text-2xl mb-2">💬</div>
                Koi conversations nahi abhi tak.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#2A4A42]">
                      <th className="text-left py-2 px-2 text-[#8A7560] font-semibold">Customer</th>
                      <th className="text-left py-2 px-2 text-[#8A7560] font-semibold">Last Message</th>
                      <th className="text-left py-2 px-2 text-[#8A7560] font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentConvs.map((conv) => (
                      <tr
                        key={conv.id}
                        className="border-b border-[#2A4A42]/50 hover:bg-[rgba(212,168,83,0.04)] cursor-pointer"
                        onClick={() => router.push('/dashboard/conversations')}
                      >
                        <td className="py-2 px-2 text-[#F7E7CE] whitespace-nowrap font-medium">
                          {conv.customer_phone}
                        </td>
                        <td className="py-2 px-2 text-[#C4A882] max-w-[140px]">
                          <div className="truncate">{conv.lastMessage}</div>
                        </td>
                        <td className="py-2 px-2 text-[#8A7560] whitespace-nowrap">
                          {timeAgo(conv.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 hover:border-[rgba(212,168,83,0.2)] transition-all">
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#F7E7CE] mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push('/dashboard/training')}
                className="w-full px-3 py-2.5 text-left flex items-center gap-2 border border-[rgba(212,168,83,0.3)] text-[#D4A853] rounded-lg hover:bg-[rgba(212,168,83,0.08)] transition-all text-xs sm:text-sm"
              >
                🧠 <span>Train My Bot</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/conversations')}
                className="w-full px-3 py-2.5 text-left flex items-center gap-2 border border-[rgba(196,168,130,0.3)] text-[#C4A882] rounded-lg hover:bg-[rgba(247,231,206,0.04)] transition-all text-xs sm:text-sm"
              >
                💬 <span>View Conversations</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/analytics')}
                className="w-full px-3 py-2.5 text-left flex items-center gap-2 border border-[rgba(196,168,130,0.3)] text-[#C4A882] rounded-lg hover:bg-[rgba(247,231,206,0.04)] transition-all text-xs sm:text-sm"
              >
                📊 <span>View Analytics</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-3 sm:gap-4">

          {/* Plan Usage — REAL DATA */}
          <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 hover:border-[rgba(212,168,83,0.2)] transition-all">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#F7E7CE]">Plan Usage</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-[rgba(196,168,130,0.08)] text-[#C4A882] border border-[rgba(196,168,130,0.15)]">
                Free Plan
              </span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-xs text-[#C4A882] mb-2">
                <span>Messages this month</span>
                <span className="text-[#D4A853] font-semibold">
                  {loading ? '—' : `${stats.messagesUsed} / ${stats.messagesLimit}`}
                </span>
              </div>
              <div className="h-2 bg-[#2A4A42] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D4A853] to-[#F0C96A] rounded-full transition-all duration-700"
                  style={{ width: loading ? '0%' : `${usedPct}%` }}
                />
              </div>
              <div className="text-xs text-[#8A7560] mt-1">
                {loading ? '' : `${stats.messagesLimit - stats.messagesUsed} messages remaining`}
              </div>
            </div>
            <button className="w-full mt-2 px-4 py-2.5 bg-gradient-to-r from-[#D4A853] to-[#C4983F] text-[#0D2420] font-semibold rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm">
              ✨ Upgrade to Growth — PKR 7,000/mo
            </button>
          </div>

          {/* Test AI Chat */}
          <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 hover:border-[rgba(212,168,83,0.2)] transition-all">
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#F7E7CE] mb-3">Test AI Chat</h3>
            <div className="space-y-2">
              <div className="text-xs text-[#8A7560] mb-1">Test Message</div>
              <input
                type="text"
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTestAI()}
                placeholder="Type a message to test the AI..."
                className="w-full bg-[#0D2420] border border-[#2A4A42] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#F7E7CE] placeholder-[#8A7560] focus:border-[rgba(212,168,83,0.5)] focus:outline-none transition-all"
              />
              <button
                onClick={handleTestAI}
                disabled={testLoading || !testMessage.trim()}
                className="w-full bg-gradient-to-r from-[#D4A853] to-[#C4983F] text-[#0D2420] font-semibold py-2.5 rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testLoading ? 'Testing...' : 'Test AI'}
              </button>

              {testResponse && (
                <div className="mt-2 p-3 bg-[#0D2420] border border-[#2A4A42] rounded-lg">
                  <div className="text-xs text-[#8A7560] mb-1">🤖 AI Response:</div>
                  <div className="text-xs sm:text-sm text-[#F7E7CE] leading-relaxed">{testResponse}</div>
                </div>
              )}
            </div>
          </div>

          {/* Upgrade Card */}
          <div className="bg-gradient-to-r from-[#D4A853] to-[#E8C869] rounded-lg p-3 sm:p-4 text-center cursor-pointer hover:shadow-lg transition-all">
            <div className="text-2xl mb-1">🚀</div>
            <h3 className="font-serif font-bold text-[#0D2420] text-sm sm:text-base mb-1">Upgrade to Growth</h3>
            <p className="text-xs text-[rgba(13,36,32,0.7)]">5,000 messages · Analytics · Priority support</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}