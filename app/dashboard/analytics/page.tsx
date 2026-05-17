'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { SkeletonCard } from '@/components/SkeletonLoader'
import EmptyState from '@/components/EmptyState'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('7D')
  const [stats, setStats] = useState({ totalMessages: 0, totalConversations: 0, trainingCount: 0 })
  const [msgData, setMsgData] = useState<any[]>([])
  const [botMessages, setBotMessages] = useState(0)
  const [customerMessages, setCustomerMessages] = useState(0)
  const [animatedValues, setAnimatedValues] = useState({ totalMessages: 0, totalConversations: 0, trainingCount: 0, responseRate: 0 })

  useEffect(() => { fetchData() }, [filter])

  useEffect(() => {
    if (!loading) {
      animateValues()
    }
  }, [loading, stats, botMessages, customerMessages])

  const animateValues = () => {
    const responseRate = stats.totalMessages > 0 ? ((botMessages / stats.totalMessages) * 100).toFixed(0) : '0'
    const targetValues = {
      totalMessages: stats.totalMessages,
      totalConversations: stats.totalConversations,
      trainingCount: stats.trainingCount,
      responseRate: parseInt(responseRate)
    }
    
    const duration = 1500
    const steps = 30
    const interval = duration / steps
    
    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      setAnimatedValues({
        totalMessages: Math.round(targetValues.totalMessages * easeProgress),
        totalConversations: Math.round(targetValues.totalConversations * easeProgress),
        trainingCount: Math.round(targetValues.trainingCount * easeProgress),
        responseRate: Math.round(targetValues.responseRate * easeProgress)
      })
      
      if (step >= steps) {
        clearInterval(timer)
        setAnimatedValues(targetValues)
      }
    }, interval)
    
    return () => clearInterval(timer)
  }

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/analytics?filter=${filter}`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics data')
      setStats(data.stats || { totalMessages: 0, totalConversations: 0, trainingCount: 0 })
      setMsgData(data.msgData || [])
      setBotMessages(data.bot_messages || 0)
      setCustomerMessages(data.customer_messages || 0)
    } catch(e: any) {
      console.error(e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const pieData = [
    { name: 'Bot Messages', value: botMessages, color: '#D4A853' },
    { name: 'Customer Messages', value: customerMessages, color: '#2A9D8F' },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#0a1f1b', border: '1px solid #2A4A42', borderRadius: '8px', padding: '12px', color: '#F7E7CE', fontSize: '13px' }}>
          <div style={{ marginBottom: '4px', color: '#8A7560' }}>{formatChartDate(label)}</div>
          <div style={{ color: '#D4A853', fontWeight: '600' }}>{payload[0].value} messages</div>
        </div>
      )
    }
    return null
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 style={{ color: '#F7E7CE', fontSize: '28px', fontWeight: '700', fontFamily: 'DM Sans, sans-serif' }}>Analytics</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['7D', '30D', '3M', 'ALL'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: filter === f ? 'none' : '1px solid #F7E7CE',
                  backgroundColor: filter === f ? '#D4A853' : 'transparent',
                  color: filter === f ? '#102C26' : '#F7E7CE',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.2s'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </div>
        ) : error ? (
          <EmptyState icon="⚠️" title="Error loading analytics" description={error} />
        ) : (
          <>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total Messages', value: animatedValues.totalMessages, icon: '📧', trend: '+12%' },
                { label: 'Conversations', value: animatedValues.totalConversations, icon: '💬', trend: '+8%' },
                { label: 'Training Sources', value: animatedValues.trainingCount, icon: '📚', trend: '+5%' },
                { label: 'Response Rate', value: animatedValues.responseRate + '%', icon: '⚡', trend: '+15%' },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  style={{
                    backgroundColor: '#0a1f1b',
                    border: '1px solid #2A4A42',
                    borderRadius: '12px',
                    padding: '20px',
                    animation: `fadeInUp 0.5s ease ${index * 0.1}s both`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{stat.icon}</span>
                    <span style={{ fontSize: '12px', color: '#2A9D8F', fontWeight: '500' }}>{stat.trend}</span>
                  </div>
                  <div style={{ color: '#8A7560', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>{stat.label}</div>
                  <div style={{ color: '#D4A853', fontSize: '32px', fontWeight: '700', fontFamily: 'DM Sans, sans-serif' }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              {/* Messages Per Day - Area Chart */}
              <div style={{ backgroundColor: '#0a1f1b', border: '1px solid #2A4A42', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ color: '#F7E7CE', fontSize: '16px', fontWeight: '600', fontFamily: 'DM Sans, sans-serif', marginBottom: '20px' }}>Messages Per Day</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={msgData}>
                    <defs>
                      <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4A853" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#D4A853" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A4A42" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#F7E7CE" 
                      fontSize={12}
                      tickFormatter={formatChartDate}
                      fontFamily="DM Sans, sans-serif"
                    />
                    <YAxis stroke="#F7E7CE" fontSize={12} fontFamily="DM Sans, sans-serif" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="messages" 
                      stroke="#D4A853" 
                      fill="url(#colorGold)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Conversations Over Time - Bar Chart */}
              <div style={{ backgroundColor: '#0a1f1b', border: '1px solid #2A4A42', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ color: '#F7E7CE', fontSize: '16px', fontWeight: '600', fontFamily: 'DM Sans, sans-serif', marginBottom: '20px' }}>Conversations Over Time</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={msgData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A4A42" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#F7E7CE" 
                      fontSize={12}
                      tickFormatter={formatChartDate}
                      fontFamily="DM Sans, sans-serif"
                    />
                    <YAxis stroke="#F7E7CE" fontSize={12} fontFamily="DM Sans, sans-serif" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="messages" 
                      fill="#D4A853" 
                      radius={[4, 4, 0, 0]}
                      animationDuration={1200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Message Distribution - Pie Chart */}
            <div style={{ backgroundColor: '#0a1f1b', border: '1px solid #2A4A42', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ color: '#F7E7CE', fontSize: '16px', fontWeight: '600', fontFamily: 'DM Sans, sans-serif', marginBottom: '20px' }}>Message Distribution</h3>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
                <ResponsiveContainer width={300} height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1000}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#D4A853" fontSize="28" fontWeight="700" fontFamily="DM Sans, sans-serif">
                      {stats.totalMessages}
                    </text>
                  </PieChart>
                </ResponsiveContainer>
                <div>
                  {pieData.map((item) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: item.color }} />
                      <span style={{ color: '#F7E7CE', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>{item.name}</span>
                      <span style={{ color: '#D4A853', fontSize: '14px', fontWeight: '600', fontFamily: 'DM Sans, sans-serif' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </DashboardLayout>
  )
}
