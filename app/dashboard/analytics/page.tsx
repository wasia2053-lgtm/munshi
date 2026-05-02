'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts'

type DayData = { date: string; messages: number }
type ConvDayData = { date: string; conversations: number }

export default function AnalyticsPage() {
  const [range, setRange] = useState<7 | 30 | 90 | 0>(0) // 0 = All Time
  const [totalMessages, setTotalMessages] = useState(0)
  const [totalConvs, setTotalConvs] = useState(0)
  const [botMessages, setBotMessages] = useState(0)
  const [customerMessages, setCustomerMessages] = useState(0)
  const [weekData, setWeekData] = useState<DayData[]>([])
  const [convData, setConvData] = useState<ConvDayData[]>([])
  const [trainingCount, setTrainingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [range])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const BUSINESS_ID = 'dfaa4c16-a081-431a-93d2-ab9ff56a5f8e'
      
      // STEP 1: Direct conversations query with business_id
      let convQuery = supabase
        .from('conversations')
        .select('id, created_at')
        .eq('business_id', BUSINESS_ID)

      // Date filter for conversations (only if not All Time)
      if (range !== 0) {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - range)
        convQuery = convQuery.gte('created_at', startDate.toISOString())
      }

      const { data: convData, error: convError } = await convQuery

      console.log('[analytics] convData:', convData, 'error:', convError)

      const convIds = convData?.map(c => c.id) || []

      if (convIds.length === 0) {
        // No conversations = no messages
        setTotalMessages(0)
        setTotalConvs(0)
        setBotMessages(0)
        setCustomerMessages(0)
        setWeekData([])
        setConvData([])
        setTrainingCount(0)
        setLoading(false)
        return
      }

      // STEP 2: Messages fetch karo conversation IDs se
      let query = supabase
        .from('messages')
        .select('sender, timestamp')
        .in('conversation_id', convIds)

      // Date filter (only if not All Time)
      if (range !== 0) {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - range)
        query = query.gte('timestamp', startDate.toISOString())
      }

      const { data: messages, error: msgError } = await query

      console.log('[analytics] messages:', messages, 'error:', msgError)

      // STEP 3: Count bot vs customer
      const botCount = messages?.filter(m => m.sender === 'bot').length || 0
      const customerCount = messages?.filter(m => m.sender === 'customer').length || 0

      // STEP 4: Group by date for chart
      const grouped: Record<string, number> = {}
      messages?.forEach(m => {
        const date = m.timestamp?.split('T')[0]
        if (date) grouped[date] = (grouped[date] || 0) + 1
      })
      const chartData = Object.entries(grouped)
        .map(([date, count]) => ({ date, messages: count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // STEP 5: Group conversations by date for chart
      const convGrouped: Record<string, number> = {}
      convData?.forEach(conv => {
        const date = conv.created_at?.split('T')[0]
        if (date) convGrouped[date] = (convGrouped[date] || 0) + 1
      })
      const convChartData = Object.entries(convGrouped)
        .map(([date, count]) => ({ date, conversations: count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Data grouping function for weekly aggregation
      const groupByWeek = (data: { date: string; messages?: number; conversations?: number }[]) => {
        const weeks: Record<string, { messages?: number; conversations?: number }> = {}
        data.forEach(item => {
          const date = new Date(item.date)
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          const key = weekStart.toISOString().split('T')[0]
          
          if (!weeks[key]) weeks[key] = {}
          if (item.messages !== undefined) weeks[key].messages = (weeks[key].messages || 0) + item.messages
          if (item.conversations !== undefined) weeks[key].conversations = (weeks[key].conversations || 0) + item.conversations
        })
        return Object.entries(weeks).map(([date, data]) => ({ date, ...data }))
      }

      // Apply grouping based on range
      let finalMsgData: DayData[] = []
      let finalConvData: ConvDayData[] = []
      
      if (range === 0 || range === 90) {
        // Group by week for All Time and 3 Months
        finalMsgData = groupByWeek(chartData) as DayData[]
        finalConvData = groupByWeek(convChartData) as ConvDayData[]
      } else {
        // Use daily data for 7 and 30 days
        finalMsgData = chartData
        finalConvData = convChartData
      }
      
      // Training data count (no date filter - total count)
      const { count: trainingCount } = await supabase
        .from('knowledge_base')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', 'dfaa4c16-a081-431a-93d2-ab9ff56a5f8e')

      console.log('[analytics] training count:', trainingCount)

      setTotalMessages(messages?.length || 0)
      setTotalConvs(convIds.length)
      setBotMessages(botCount)
      setCustomerMessages(customerCount)
      setWeekData(finalMsgData)
      setConvData(finalConvData)
      setTrainingCount(trainingCount || 0)
    } catch (e) {
      console.error('Analytics error:', e)
    }
    setLoading(false)
  }

  const botPct = totalMessages > 0 ? Math.round((botMessages / totalMessages) * 100) : 0
  const custPct = 100 - botPct

  // Donut chart data
  const donutData = [
    { name: 'Bot', value: botMessages, color: '#D4A853' },
    { name: 'Customer', value: customerMessages, color: '#4CAF82' }
  ]

  return (
    <DashboardLayout
      title="Analytics"
      subtitle={loading ? 'Loading...' : `${totalConvs} conversations · ${totalMessages} messages total`}
    >
      {/* Time Range Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { label: '7D', value: 7 as const },
          { label: '30D', value: 30 as const },
          { label: '3M', value: 90 as const },
          { label: 'All', value: 0 as const },
        ].map(btn => (
          <button key={btn.value} onClick={() => setRange(btn.value)}
            style={{
              padding: '6px 18px', borderRadius: '20px',
              background: range === btn.value ? '#D4A853' : 'transparent',
              color: range === btn.value ? '#102C26' : '#D4A853',
              border: '1px solid #D4A853',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer'
            }}>
            {btn.label}
          </button>
        ))}
      </div>

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

        {/* Training Sources Card */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-xl p-4 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <div className="text-xl mb-2">🧠</div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#F7E7CE]">
            {loading ? '—' : trainingCount}
          </div>
          <div className="text-xs text-[#8A7560] mt-1">Training Sources</div>
          <div className="text-xs text-[#4CAF82] mt-1">↑ Real data</div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

        {/* Messages Per Day Chart */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-xl p-4 sm:p-5 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <h3 className="font-serif text-base font-bold text-[#F7E7CE] mb-1">Messages per Day</h3>
          <p className="text-xs text-[#8A7560] mb-4">
            {range === 0 ? 'All time — real data' :
             range === 7 ? 'Last 7 days — real data' :
             range === 30 ? 'Last 30 days — real data' :
             'Last 3 months — real data'}
          </p>

          {loading ? (
            <div className="h-48 bg-[#0D2420] rounded-lg animate-pulse" />
          ) : totalMessages === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-[#8A7560] text-xs">
              <div className="text-3xl mb-2">📊</div>
              Koi messages nahi abhi tak
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <AreaChart data={weekData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4A853" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#D4A853" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A4A42" opacity={0.3} />
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#C4A882' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tickFormatter={(value) => {
                    // Show only day/month short format
                    const date = new Date(value)
                    return `${date.getDate()}/${date.getMonth() + 1}` 
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#8A7560' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A3D35', 
                    border: '1px solid #2A4A42',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#F7E7CE' }}
                  itemStyle={{ color: '#D4A853' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="#D4A853" 
                  strokeWidth={2}
                  fill="url(#areaGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
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
                <circle cx="80" cy="80" r={70} fill="none" stroke="#2A4A42" strokeWidth="22" />
                {/* Bot segment */}
                {(() => {
                  const radius = 70
                  const circumference = 2 * Math.PI * radius
                  const botPercent = totalMessages > 0 ? botMessages / totalMessages : 0
                  const custPercent = totalMessages > 0 ? customerMessages / totalMessages : 0
                  const botDash = botPercent * circumference
                  const custDash = custPercent * circumference
                  return (
                    <>
                      {botPct > 0 && (
                        <circle
                          cx="80" cy="80" r={70}
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
                          cx="80" cy="80" r={70}
                          fill="none"
                          stroke="#4CAF82"
                          strokeWidth="22"
                          strokeDasharray={`${custDash} ${circumference}`}
                          strokeDashoffset={-botDash}
                          strokeLinecap="round"
                          transform="rotate(-90 80 80)"
                        />
                      )}
                    </>
                  )
                })()}
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

        {/* Conversations Per Day Chart */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-xl p-4 sm:p-5 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <h3 className="font-serif text-base font-bold text-[#F7E7CE] mb-1">Conversations per Day</h3>
          <p className="text-xs text-[#8A7560] mb-4">
            {range === 0 ? 'All time — real data' :
             range === 7 ? 'Last 7 days — real data' :
             range === 30 ? 'Last 30 days — real data' :
             'Last 3 months — real data'}
          </p>

          {loading ? (
            <div className="h-48 bg-[#0D2420] rounded-lg animate-pulse" />
          ) : totalConvs === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-[#8A7560] text-xs">
              <div className="text-3xl mb-2">💬</div>
              Koi conversations nahi abhi tak
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <BarChart data={convData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A4A42" opacity={0.3} />
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#C4A882' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tickFormatter={(value) => {
                    // Show only day/month short format
                    const date = new Date(value)
                    return `${date.getDate()}/${date.getMonth() + 1}` 
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#8A7560' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A3D35', 
                    border: '1px solid #2A4A42',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#F7E7CE' }}
                  itemStyle={{ color: '#D4A853' }}
                />
                <Bar 
                  dataKey="conversations" 
                  fill="#D4A853" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
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
              {loading ? '—' : trainingCount}
            </div>
            <div className="text-xs text-[#8A7560] mt-1">Training Sources</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}