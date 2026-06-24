"use client"
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Inbox, Download } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'

type StatCardProps = {
  title: string
  value: number
  suffix?: string
  prefix?: string
  delta: number
  sparklineData: { value: number }[]
  index: number
}

function AnimatedCount({ value, duration = 0.8 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setCount(value)
      return
    }
    let start: number | null = null
    const step = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      if (progress < 1) {
        setCount(Math.floor(eased * value))
        requestAnimationFrame(step)
      } else {
        setCount(value)
      }
    }
    requestAnimationFrame(step)
  }, [value, duration, prefersReducedMotion])

  return <span>{count}</span>
}

function StatCard({ title, value, suffix = '', prefix = '', delta, sparklineData, index }: StatCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const isPositive = delta >= 0
  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      style={{
        backgroundColor: '#1a1b1c',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <h3 style={{ color: '#888', fontSize: '13px', fontWeight: 500, fontFamily: 'Geist, sans-serif' }}>{title}</h3>
        <div style={{
          backgroundColor: isPositive ? 'rgba(74, 225, 118, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: isPositive ? '#4ae176' : '#ef4444',
          padding: '2px 8px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: 'Geist, sans-serif',
        }}>
          {isPositive ? '▲' : '▼'} {Math.abs(delta)}%
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '32px', fontWeight: 600, color: '#fff', fontFamily: 'Geist, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
          {prefix}<AnimatedCount value={value} />{suffix}
        </div>
        <div style={{ width: '60px', height: '30px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line type="monotone" dataKey="value" stroke={isPositive ? '#4ae176' : '#ef4444'} strokeWidth={2} dot={false} isAnimationActive={!prefersReducedMotion} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#1a1b1c', border: '1px solid #4ae176', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '13px', fontFamily: 'Geist, sans-serif', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <div style={{ marginBottom: '8px', color: '#888', fontWeight: 500 }}>{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ color: p.color, fontWeight: 600, marginBottom: '4px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span>{p.name}:</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: '#fff' }}>{p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function AnalyticsContent() {
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<string>(searchParams.get('filter') || '7D')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const [stats, setStats] = useState({
    totalMessages: 0, totalConversations: 0, trainingCount: 0,
    resolutionRate: 0, avgMessagesPerConv: 0, peakHour: 0, repeatCustomersPct: 0,
  })
  const [deltas, setDeltas] = useState({ resolutionRate: 0, avgMessagesPerConv: 0, peakHour: 0, repeatCustomersPct: 0 })
  const [resolutionData, setResolutionData] = useState<any[]>([])
  const [sparklines, setSparklines] = useState<any>({ resolutionRate: [], avgMessages: [], peakHour: [], repeatCustomers: [] })
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [maxHeatmapCount, setMaxHeatmapCount] = useState(0)
  const [languageData, setLanguageData] = useState<any[]>([])
  const [hoveredLang, setHoveredLang] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?filter=${filter}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats || stats)
        setDeltas(data.deltas || deltas)
        setResolutionData(data.msgData || [])
        setSparklines(data.sparklines || { resolutionRate: [], avgMessages: [], peakHour: [], repeatCustomers: [] })
        setHeatmapData(data.heatmap || [])
        const maxCount = (data.heatmap || []).reduce((m: number, d: any) => Math.max(m, d.count), 0)
        setMaxHeatmapCount(maxCount)
        setLanguageData(data.languages || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Analytics fetch error:', err)
        setLoading(false)
      })
  }, [filter])

  const handleExport = () => {
    setExporting(true)
    const rows = [['Date', 'Resolved', 'Unresolved']]
    resolutionData.forEach((d) => rows.push([d.date, String(d.resolved), String(d.unresolved)]))
    const csvContent = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const today = new Date().toISOString().split('T')[0]
    a.href = url
    a.download = `munshi-analytics-${filter}-${today}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setTimeout(() => {
      setExporting(false)
      setExported(true)
      setTimeout(() => setExported(false), 2000)
    }, 500)
  }

  const chartAnimationProps = prefersReducedMotion
    ? { isAnimationActive: false }
    : { animationDuration: 1000, animationEasing: 'ease-out' as const }

  const languageTotal = languageData.reduce((a, b) => a + b.value, 0)

  return (
    <AppShell>
      <div style={{ width: '100%', fontFamily: 'Geist, sans-serif' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 600 }}>Analytics</h1>
            <p style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>Every conversation, decoded.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', backgroundColor: '#1a1b1c', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {['7D', '30D', '3M', 'ALL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: filter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: filter === f ? '#fff' : '#888',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={handleExport}
              disabled={exporting || exported}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '8px',
                backgroundColor: exported ? '#4ae176' : '#1a1b1c',
                border: exported ? '1px solid #4ae176' : '1px solid rgba(255,255,255,0.06)',
                color: exported ? '#121314' : '#fff',
                cursor: 'pointer', fontSize: '13px', fontWeight: 500, height: '36px',
              }}
            >
              {exporting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 14, height: 14, border: '2px solid #888', borderTopColor: '#fff', borderRadius: '50%' }} />
              ) : exported ? (
                <span>✓ Exported</span>
              ) : (
                <><Download size={14} /> Export CSV</>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'grid', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ height: '116px', backgroundColor: '#1a1b1c', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                    <motion.div animate={prefersReducedMotion ? {} : { x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }} />
                  </div>
                ))}
              </div>
              <div style={{ height: '400px', backgroundColor: '#1a1b1c', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                <motion.div animate={prefersReducedMotion ? {} : { x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }} />
              </div>
            </motion.div>
          ) : stats.totalMessages === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', backgroundColor: '#1a1b1c', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(74, 225, 118, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#4ae176' }}>
                <Inbox size={32} />
              </div>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Data Available</h3>
              <p style={{ color: '#888', fontSize: '14px' }}>There is no analytics data for the selected period.</p>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <StatCard title="Resolution Rate" value={stats.resolutionRate} suffix="%" delta={deltas.resolutionRate} sparklineData={sparklines.resolutionRate} index={0} />
                <StatCard title="Avg Messages / Conv" value={stats.avgMessagesPerConv} delta={deltas.avgMessagesPerConv} sparklineData={sparklines.avgMessages} index={1} />
                <StatCard title="Peak Hour" value={stats.peakHour} suffix=":00" delta={deltas.peakHour} sparklineData={sparklines.peakHour} index={2} />
                <StatCard title="Repeat Customers" value={stats.repeatCustomersPct} suffix="%" delta={deltas.repeatCustomersPct} sparklineData={sparklines.repeatCustomers} index={3} />
              </div>

              {/* Resolution Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                style={{ backgroundColor: '#1a1b1c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}
              >
                <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Resolution Trend</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={resolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4ae176" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4ae176" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="resolved" stroke="#4ae176" fill="url(#colorResolved)" strokeWidth={2} {...chartAnimationProps} name="Resolved" />
                      <Area type="monotone" dataKey="unresolved" stroke="#ef4444" fill="transparent" strokeWidth={2} {...chartAnimationProps} name="Unresolved" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Peak Hours + Language Distribution side-by-side */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', minWidth: 0 }}>

                {/* Peak Hours Heatmap */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  style={{ backgroundColor: '#1a1b1c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', overflow: 'hidden', maxWidth: '100%', minWidth: 0 }}
                >
                  <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Peak Hours (by day)</h3>
                  {/* Scroll container — only this scrolls horizontally, not the page */}
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <div style={{ minWidth: '472px' }}>{/* 40px label + 24 × 18px cells = 472px */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {Array.from({ length: 7 }, (_, dayIndex) => (
                          <div key={dayIndex} style={{ display: 'flex', gap: '4px', height: '32px' }}>
                            <div style={{ width: '40px', flexShrink: 0, color: '#888', fontSize: '11px', display: 'flex', alignItems: 'center' }}>
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex]}
                            </div>
                            {Array.from({ length: 24 }, (_, hour) => {
                              const cellData = heatmapData.find((d: any) => d.day === dayIndex && d.hour === hour)
                              const count = cellData ? cellData.count : 0
                              const opacity = maxHeatmapCount > 0 ? count / maxHeatmapCount : 0
                              const idx = dayIndex * 24 + hour
                              return (
                                <motion.div
                                  key={hour}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: idx * 0.004, duration: 0.3 }}
                                  whileHover={{ scale: 1.1, zIndex: 10 }}
                                  title={`${count} messages at ${hour}:00`}
                                  style={{
                                    minWidth: '18px',
                                    width: '18px',
                                    height: '100%',
                                    flexShrink: 0,
                                    backgroundColor: opacity > 0 ? `rgba(74, 225, 118, ${Math.max(0.15, opacity)})` : 'rgba(255,255,255,0.03)',
                                    borderRadius: '4px',
                                    cursor: 'crosshair',
                                  }}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                      {/* Hour labels */}
                      <div style={{ display: 'flex', gap: '4px', marginTop: '8px', paddingLeft: '44px' }}>
                        {Array.from({ length: 24 }, (_, hour) => (
                          <div key={hour} style={{ minWidth: '18px', width: '18px', flexShrink: 0, color: '#888', fontSize: '9px', textAlign: 'center' }}>
                            {hour % 3 === 0 ? hour : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Language Distribution */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  style={{ backgroundColor: '#1a1b1c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', minWidth: 0 }}
                >
                  <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Language Distribution</h3>
                  {languageData.length === 0 ? (
                    <div style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>No bot replies yet for this period.</div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
                      <div style={{ width: '220px', height: '220px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={languageData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none" {...chartAnimationProps}>
                              {languageData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: hoveredLang === entry.name ? `drop-shadow(0 0 8px ${entry.color})` : 'none' }} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                            <AnimatedCount value={languageTotal} />
                          </div>
                          <div style={{ fontSize: '12px', color: '#888' }}>Total</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {languageData.map((lang: { name: string; value: number; color: string }) => (
                          <div key={lang.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onMouseEnter={() => setHoveredLang(lang.name)} onMouseLeave={() => setHoveredLang(null)}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: lang.color, transform: hoveredLang === lang.name ? 'scale(1.3)' : 'scale(1)' }} />
                            <span style={{ color: hoveredLang === lang.name ? '#fff' : '#888', fontSize: '14px' }}>{lang.name}</span>
                            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginLeft: 'auto' }}>
                              {languageTotal > 0 ? Math.round((lang.value / languageTotal) * 100) : 0}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>

              </div>{/* end Peak Hours + Language grid */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}

function AnalyticsLoading() {
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <div style={{ color: '#888', fontSize: '14px' }}>Loading analytics...</div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsContent />
    </Suspense>
  )
}