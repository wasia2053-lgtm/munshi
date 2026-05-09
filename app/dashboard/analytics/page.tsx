'use client'
import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { SkeletonCard } from '@/components/SkeletonLoader'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('7D')
  const [stats, setStats] = useState({ totalMessages: 0, totalConversations: 0, trainingCount: 0 })
  const [msgData, setMsgData] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => { fetchData() }, [filter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const res = await fetch(`/api/analytics?filter=${filter}`, { credentials: 'include' })
      const data = await res.json()
      setStats(data.stats || { totalMessages: 0, totalConversations: 0, trainingCount: 0 })
      setMsgData(data.msgData || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const pieData = [
    { name: 'Bot', value: stats.totalMessages, color: '#D4A853' },
    { name: 'Conversations', value: stats.totalConversations, color: '#4CAF82' },
  ]

  return (
    <DashboardLayout>
      <div style={{ padding: '16px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ color: '#F7E7CE', fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Analytics</h1>

        {['7D','30D','3M','ALL'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ marginRight: '8px', padding: '6px 16px', borderRadius: '6px', border: '1px solid #2A4A42',
              backgroundColor: filter === f ? '#D4A853' : 'transparent',
              color: filter === f ? '#102C26' : '#F7E7CE', cursor: 'pointer' }}>
            {f}
          </button>
        ))}

        {loading ? (
          <div style={{ marginTop: '24px' }}>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </div>
        ) : (
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total Messages', value: stats.totalMessages },
                { label: 'Conversations', value: stats.totalConversations },
                { label: 'Training Sources', value: stats.trainingCount },
              ].map(s => (
                <div key={s.label} style={{ backgroundColor: '#0D2420', border: '1px solid #2A4A42', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ color: '#8A7560', fontSize: '13px' }}>{s.label}</div>
                  <div style={{ color: '#D4A853', fontSize: '28px', fontWeight: '700' }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: '#0D2420', border: '1px solid #2A4A42', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ color: '#F7E7CE', marginBottom: '16px', fontWeight: '600' }}>Messages Per Day</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={msgData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A4A42" />
                  <XAxis dataKey="date" stroke="#8A7560" fontSize={12} />
                  <YAxis stroke="#8A7560" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0D2420', border: '1px solid #2A4A42', color: '#F7E7CE' }} />
                  <Area type="monotone" dataKey="messages" stroke="#D4A853" fill="#D4A85330" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ backgroundColor: '#0D2420', border: '1px solid #2A4A42', borderRadius: '12px', padding: '20px' }}>
              <div style={{ color: '#F7E7CE', marginBottom: '16px', fontWeight: '600' }}>Overview</div>
              <PieChart width={200} height={200}>
                <Pie data={pieData} cx={95} cy={95} innerRadius={55} outerRadius={85} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
