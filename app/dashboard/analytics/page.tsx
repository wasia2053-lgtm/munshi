'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'

type DayData = { day: string; messages: number }

export default function AnalyticsPage() {
  const [totalMessages, setTotalMessages] = useState(0)
  const [totalConvs, setTotalConvs] = useState(0)
  const [botMessages, setBotMessages] = useState(0)
  const [customerMessages, setCustomerMessages] = useState(0)
  const [weekData, setWeekData] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      // Total messages
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })

      // Total conversations
      const { count: convCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })

      // Bot messages count
      const { count: botCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender', 'bot')

      // Customer messages count
      const { count: custCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender', 'customer')

      // Messages per day - last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const weekDays: DayData[] = []

      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .gte('timestamp', startOfDay.toISOString())
          .lte('timestamp', endOfDay.toISOString())

        weekDays.push({
          day: days[date.getDay()],
          messages: count || 0,
        })
      }

      setTotalMessages(msgCount || 0)
      setTotalConvs(convCount || 0)
      setBotMessages(botCount || 0)
      setCustomerMessages(custCount || 0)
      setWeekData(weekDays)
    } catch (e) {
      console.error('Analytics error:', e)
    }
    setLoading(false)
  }

  const maxMessages = Math.max(...weekData.map(d => d.messages), 1)
  const botPct = totalMessages > 0 ? Math.round((botMessages / totalMessages) * 100) : 0
  const custPct = 100 - botPct

  // SVG chart dimensions
  const chartW = 400
  const chartH = 180
  const padL = 10
  const padR = 10
  const padT = 10
  const padB = 30
  const plotW = chartW - padL - padR
  const plotH = chartH - padT - padB

  const points = weekData.map((d, i) => {
    const x = padL + (i / (weekData.length - 1 || 1)) * plotW
    const y = padT + plotH - (d.messages / maxMessages) * plotH
    return { x, y, ...d }
  })

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
  const areaPath = points.length > 0
    ? `M${points[0].x},${padT + plotH} L${polyline.replace(/ /g, ' L')} L${points[points.length - 1].x},${padT + plotH} Z`
    : ''

  // Donut
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const botDash = (botPct / 100) * circumference
  const custDash = (custPct / 100) * circumference

  return (
    <DashboardLayout
      title="Analytics"
      subtitle={loading ? 'Loading...' : `${totalConvs} conversations · ${totalMessages} messages total`}
    >
      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-xl p-4 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <div className="text-xl mb-2">📨</div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#F7E7CE]">
            {loading ? '—' : totalMessages}
          </div>
          <div className="text-xs text-[#8A7560] mt-1">Total Messages</div>
          <div className="text-xs text-[#4CAF82] mt-1">↑ Real data</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-xl p-4 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <div className="text-xl mb-2">💬</div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#F7E7CE]">
            {loading ? '—' : totalConvs}
          </div>
          <div className="text-xs text-[#8A7560] mt-1">Conversations</div>
          <div className="text-xs text-[#4CAF82] mt-1">↑ Real data</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-xl p-4 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <div className="text-xl mb-2">🤖</div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#F7E7CE]">
            {loading ? '—' : botMessages}
          </div>
          <div className="text-xs text-[#8A7560] mt-1">Bot Replies</div>
          <div className="text-xs text-[#4CAF82] mt-1">{loading ? '' : `${botPct}% automated`}</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-xl p-4 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <div className="text-xl mb-2">👥</div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#F7E7CE]">
            {loading ? '—' : customerMessages}
          </div>
          <div className="text-xs text-[#8A7560] mt-1">Customer Messages</div>
          <div className="text-xs text-[#4CAF82] mt-1">↑ Real data</div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

        {/* Messages Per Day Chart */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-xl p-4 sm:p-5 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <h3 className="font-serif text-base font-bold text-[#F7E7CE] mb-1">Messages per Day</h3>
          <p className="text-xs text-[#8A7560] mb-4">Last 7 days — real data</p>

          {loading ? (
            <div className="h-48 bg-[#0D2420] rounded-lg animate-pulse" />
          ) : totalMessages === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-[#8A7560] text-xs">
              <div className="text-3xl mb-2">📊</div>
              Koi messages nahi abhi tak
            </div>
          ) : (
            <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} className="overflow-visible">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4A853" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#D4A853" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#D4A853" />
                  <stop offset="100%" stopColor="#F0C96A" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                const y = padT + frac * plotH
                const val = Math.round(maxMessages * (1 - frac))
                return (
                  <g key={i}>
                    <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#2A4A42" strokeWidth="1" opacity="0.5" />
                    <text x={padL} y={y - 3} fill="#8A7560" fontSize="9" textAnchor="start">{val}</text>
                  </g>
                )
              })}

              {/* Area fill */}
              {points.length > 1 && (
                <path d={areaPath} fill="url(#areaGrad)" />
              )}

              {/* Line */}
              {points.length > 1 && (
                <polyline
                  points={polyline}
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points + labels */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#D4A853" stroke="#0D2420" strokeWidth="2" />
                  {p.messages > 0 && (
                    <text x={p.x} y={p.y - 9} fill="#C4A882" fontSize="9" textAnchor="middle">{p.messages}</text>
                  )}
                  <text x={p.x} y={chartH - 4} fill="#8A7560" fontSize="10" textAnchor="middle">{p.day}</text>
                </g>
              ))}
            </svg>
          )}
        </div>

        {/* Bot vs Customer Donut */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-xl p-4 sm:p-5 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <h3 className="font-serif text-base font-bold text-[#F7E7CE] mb-1">Response Distribution</h3>
          <p className="text-xs text-[#8A7560] mb-4">Bot vs Customer messages</p>

          {loading ? (
            <div className="h-48 bg-[#0D2420] rounded-lg animate-pulse" />
          ) : totalMessages === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-[#8A7560] text-xs">
              <div className="text-3xl mb-2">🤖</div>
              Koi data nahi abhi tak
            </div>
          ) : (
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <defs>
                  <linearGradient id="botGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4A853" />
                    <stop offset="100%" stopColor="#F0C96A" />
                  </linearGradient>
                </defs>
                {/* Background circle */}
                <circle cx="80" cy="80" r={radius} fill="none" stroke="#2A4A42" strokeWidth="22" />
                {/* Bot segment */}
                {botPct > 0 && (
                  <circle
                    cx="80" cy="80" r={radius}
                    fill="none"
                    stroke="url(#botGrad)"
                    strokeWidth="22"
                    strokeDasharray={`${botDash} ${circumference}`}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                  />
                )}
                {/* Customer segment */}
                {custPct > 0 && (
                  <circle
                    cx="80" cy="80" r={radius}
                    fill="none"
                    stroke="#4CAF82"
                    strokeWidth="22"
                    strokeDasharray={`${custDash} ${circumference}`}
                    strokeDashoffset={-botDash}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                  />
                )}
                <text x="80" y="74" fill="#F7E7CE" fontSize="22" fontWeight="700" textAnchor="middle" fontFamily="serif">{botPct}%</text>
                <text x="80" y="91" fill="#8A7560" fontSize="10" textAnchor="middle">Bot</text>
              </svg>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#D4A853] to-[#F0C96A]" />
                  <div>
                    <div className="text-sm text-[#F7E7CE] font-medium">Bot Replies</div>
                    <div className="text-xs text-[#8A7560]">{botMessages} msgs ({botPct}%)</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#4CAF82]" />
                  <div>
                    <div className="text-sm text-[#F7E7CE] font-medium">Customers</div>
                    <div className="text-xs text-[#8A7560]">{customerMessages} msgs ({custPct}%)</div>
                  </div>
                </div>
                <div className="mt-2 p-2 bg-[#0D2420] rounded-lg">
                  <div className="text-xs text-[#8A7560]">Total</div>
                  <div className="text-sm text-[#D4A853] font-bold">{totalMessages} messages</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-xl p-4 sm:p-5 hover:border-[rgba(212,168,83,0.2)] transition-all">
        <h3 className="font-serif text-base font-bold text-[#F7E7CE] mb-4">Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-[#0D2420] rounded-lg">
            <div className="font-serif text-xl font-bold text-[#D4A853]">{loading ? '—' : totalConvs}</div>
            <div className="text-xs text-[#8A7560] mt-1">Total Conversations</div>
          </div>
          <div className="text-center p-3 bg-[#0D2420] rounded-lg">
            <div className="font-serif text-xl font-bold text-[#D4A853]">{loading ? '—' : totalMessages}</div>
            <div className="text-xs text-[#8A7560] mt-1">Total Messages</div>
          </div>
          <div className="text-center p-3 bg-[#0D2420] rounded-lg">
            <div className="font-serif text-xl font-bold text-[#D4A853]">{loading ? '—' : `${botPct}%`}</div>
            <div className="text-xs text-[#8A7560] mt-1">Automation Rate</div>
          </div>
          <div className="text-center p-3 bg-[#0D2420] rounded-lg">
            <div className="font-serif text-xl font-bold text-[#D4A853]">
              {loading ? '—' : totalConvs > 0 ? `${(totalMessages / totalConvs).toFixed(1)}` : '0'}
            </div>
            <div className="text-xs text-[#8A7560] mt-1">Msgs per Conv</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}