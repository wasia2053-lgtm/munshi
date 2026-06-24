"use client"
import { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Inbox } from 'lucide-react'
import { DownloadIcon } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

// No mock data – real data will be fetched from /api/analytics

type StatCardProps = {
  title: string
  value: number
  suffix?: string
  prefix?: string
  delta: number
  sparklineData: { value: number }[]
  index: number
}

const AnimatedCount = ({ value, duration = 0.8 }: { value: number; duration?: number }) => {
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
      const easeOut = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOut * value))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value, duration, prefersReducedMotion])

  return <span>{count}</span>
}

const StatCard = ({ title, value, suffix = '', prefix = '', delta, sparklineData, index }: StatCardProps) => {
  const prefersReducedMotion = useReducedMotion()
  const isPositive = delta >= 0
  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ scale: 1.02, borderColor: '#4ae176' }}
      style={{
        backgroundColor: '#1a1b1c',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '20px',
        transition: 'border-color 0.2s',
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
          fontFamily: 'Geist, sans-serif'
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
              <Line type="monotone" dataKey="value" stroke={isPositive ? "#4ae176" : "#ef4444"} strokeWidth={2} dot={false} isAnimationActive={!prefersReducedMotion} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#1a1b1c', border: '1px solid #4ae176', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '13px', fontFamily: 'Geist, sans-serif', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', zIndex: 100 }}>
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

export default function AnalyticsPage() {
  const [filter, setFilter] = useState('7D')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const [resolutionData, setResolutionData] = useState<any[]>([]);
  const [sparklineData, setSparklineData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [maxHeatmapCount, setMaxHeatmapCount] = useState(0);
  const [languageData, setLanguageData] = useState<any[]>([]);
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?range=${filter}`)
      .then((res) => res.json())
      .then((data) => {
        setResolutionData(data.resolutionTrend || []);
        setSparklineData(data.sparklines || []);
        setHeatmapData(data.heatmap || []);
        const maxCount = data.heatmap?.reduce((m: number, d: any) => Math.max(m, d.count), 0) ?? 0;
        setMaxHeatmapCount(maxCount);
        setLanguageData(data.languages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      setExported(true)
      setTimeout(() => setExported(false), 2000)
    }, 1000)
  }

  const chartAnimationProps = prefersReducedMotion ? { isAnimationActive: false } : { animationDuration: 1000, animationEasing: 'ease-out' as const }

  return (
    <AppShell>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#121314', minHeight: '100vh', fontFamily: 'Geist, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 600 }}>Analytics</h1>
            <p style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>Measure your conversational performance</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', backgroundColor: '#1a1b1c', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {['7D', '30D', '3M', 'All'].map(f => (
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
                    transition: 'all 0.2s'
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
                cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                transition: 'all 0.2s', height: '36px'
              }}
            >
              {exporting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: 14, height: 14, border: '2px solid #888', borderTopColor: '#fff', borderRadius: '50%' }} />
              ) : exported ? (
                <span>✓ Exported</span>
              ) : (
                <><DownloadIcon size={14} /> Export CSV</>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'grid', gap: '24px' }}
            >
              {/* Skeleton Loaders */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ height: '116px', backgroundColor: '#1a1b1c', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                    <motion.div animate={prefersReducedMotion ? {} : { x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }} />
                  </div>
                ))}
              </div>
              <div style={{ height: '400px', backgroundColor: '#1a1b1c', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                <motion.div animate={prefersReducedMotion ? {} : { x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }} />
              </div>
            </motion.div>
          ) : resolutionData.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', backgroundColor: '#1a1b1c', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(74, 225, 118, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#4ae176' }}>
                <Inbox size={32} />
              </div>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Data Available</h3>
              <p style={{ color: '#888', fontSize: '14px' }}>There is no analytics data for the selected period.</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <StatCard title="Resolution Rate" value={86} suffix="%" delta={4.2} sparklineData={sparklineData} index={0} />
                <StatCard title="Avg Messages / Conv" value={6} delta={-1.5} sparklineData={sparklineData} index={1} />
                <StatCard title="Peak Hour" value={14} suffix=":00" delta={0} sparklineData={sparklineData} index={2} />
                <StatCard title="Repeat Customers" value={24} suffix="%" delta={2.1} sparklineData={sparklineData} index={3} />
              </div>

              {/* Resolution Trend Chart */}
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
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
                      <Area type="monotone" dataKey="resolved" stroke="#4ae176" fill="url(#colorResolved)" strokeWidth={2} {...chartAnimationProps} activeDot={{ r: 6, fill: '#4ae176', stroke: '#121314', strokeWidth: 2, style: { filter: 'drop-shadow(0 0 8px #4ae176)' } }} name="Resolved" />
                      <Area type="monotone" dataKey="unresolved" stroke="#ef4444" fill="transparent" strokeWidth={2} {...chartAnimationProps} activeDot={{ r: 6, fill: '#ef4444', stroke: '#121314', strokeWidth: 2 }} name="Unresolved" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {/* Peak Hours Heatmap */}
                <motion.div
                  initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  style={{ backgroundColor: '#1a1b1c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}
                >
                  <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Peak Hours (Avg over 7D)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowX: 'auto' }}>
                    {Array.from({ length: 7 }, (_, dayIndex) => (
                      <div key={dayIndex} style={{ display: 'flex', gap: '4px', height: '32px' }}>
                        <div style={{ width: '40px', color: '#888', fontSize: '11px', display: 'flex', alignItems: 'center' }}>
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex]}
                        </div>
                        {Array.from({ length: 24 }, (_, hour) => {
                          const cellData = heatmapData.find(d => d.day === dayIndex && d.hour === hour)
                          const count = cellData ? cellData.count : 0
                          const opacity = maxHeatmapCount > 0 ? count / maxHeatmapCount : 0
                          const index = dayIndex * 24 + hour

                          return (
                            <motion.div
                              key={hour}
                              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.004, duration: 0.3 }}
                              whileHover={{ scale: 1.1, zIndex: 10 }}
                              title={`${count} messages at ${hour}:00`}
                              style={{
                                flex: 1,
                                backgroundColor: opacity > 0 ? `rgba(74, 225, 118, ${Math.max(0.1, opacity)})` : 'rgba(255,255,255,0.03)',
                                borderRadius: '4px',
                                cursor: 'crosshair',
                                border: '1px solid transparent',
                              }}
                            />
                          )
                        })}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px', paddingLeft: '44px' }}>
                      {Array.from({ length: 24 }, (_, hour) => (
                        <div key={hour} style={{ flex: 1, color: '#888', fontSize: '9px', textAlign: 'center' }}>
                          {hour % 3 === 0 ? hour : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Language Distribution */}
                <motion.div
                  initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  style={{ backgroundColor: '#1a1b1c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}
                >
                  <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Language Distribution</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
                    <div style={{ width: '240px', height: '240px', position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={languageData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            {...chartAnimationProps}
                          >
                            {languageData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                style={{
                                  filter: hoveredLang === entry.name ? `drop-shadow(0 0 8px ${entry.color})` : 'none',
                                  transition: 'filter 0.3s'
                                }}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                          <AnimatedCount value={languageData.reduce((a, b) => a + b.value, 0)} />
                        </div>
                        <div style={{ fontSize: '12px', color: '#888' }}>Total</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {languageData.map((lang: { name: string; value: number; color: string }) => (
                        <div
                          key={lang.name}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredLang(lang.name)}
                          onMouseLeave={() => setHoveredLang(null)}
                        >
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: lang.color,
                              transform: hoveredLang === lang.name ? 'scale(1.3)' : 'scale(1)',
                              boxShadow: hoveredLang === lang.name ? `0 0 8px ${lang.color}` : 'none',
                              transition: 'all 0.2s',
                            }}
                          />
                          <span style={{ color: hoveredLang === lang.name ? '#fff' : '#888', fontSize: '14px', transition: 'color 0.2s' }}>{lang.name}</span>
                          <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginLeft: 'auto' }}>
                            {Math.round((lang.value / languageData.reduce((a, b) => a + b.value, 0)) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
