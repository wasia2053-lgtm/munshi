"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { motion } from "framer-motion"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts"
import { Download, TrendingUp, TrendingDown, Languages, MessagesSquare, CheckCircle2 } from "lucide-react"
import { RecentConversations } from "@/components/recent-conversations"

type RangeOption = "7d" | "1m" | "3m" | "6m" | "all"

type OverviewData = {
  stats: { totalMessages: number; totalConversations: number; avgReplyMinutes: number; resolutionRate: number }
  deltas: { totalMessages: number; totalConversations: number; avgReplyMinutes: number; resolutionRate: number }
  chartRows: { date: string; messages: number }[]
  conversationSparkline: { value: number }[]
  newConversationsCount: number
  languages: { name: string; value: number; color: string }[]
  languagesTotal: number
  resolutionSplit: { resolved: number; unresolved: number; resolvedPct: number }
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function formatShortDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function DeltaBadge({ value, lowerIsBetter = false }: { value: number; lowerIsBetter?: boolean }) {
  const isGood = lowerIsBetter ? value <= 0 : value >= 0
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 700,
        background: isGood ? "rgba(74,225,118,0.1)" : "rgba(239,68,68,0.1)",
        color: isGood ? "#4ae176" : "#ef4444",
      }}
    >
      {isGood ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {Math.abs(value)}%
    </span>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#1a1b1c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
        padding: "10px 14px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}>
        <div style={{ color: "#888", fontSize: "11px", marginBottom: "4px" }}>{formatShortDate(label)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ae176" }} />
          <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>{payload[0].value} messages</span>
        </div>
      </div>
    )
  }
  return null
}

const RANGE_TABS: { value: RangeOption; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "all", label: "All Time" },
]

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeOption>("1m")
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dashboard/overview?range=${range}`, { credentials: "include" })
      .then((res) => res.json())
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [range])

  async function handleExport() {
    if (!data) return
    setExporting(true)
    try {
      const rows = [["Date", "Messages"]]
      data.chartRows.forEach((r) => rows.push([csvEscape(r.date), String(r.messages)]))
      const csvContent = "\uFEFF" + rows.map((r) => r.join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const today = new Date().toISOString().split("T")[0]
      a.href = url
      a.download = `munshi-analytics-${range}-${today}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
      setExported(true)
      setTimeout(() => setExported(false), 2000)
    }
  }

  const card: React.CSSProperties = {
    backgroundColor: "#1a1b1c",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
  }

  return (
    <AppShell>
      <div style={{ width: "100%", fontFamily: "Geist, sans-serif" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: "26px", fontWeight: 700 }}>Analytics</h1>
            <p style={{ color: "#888", fontSize: "14px", marginTop: "4px" }}>Every conversation, decoded.</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", backgroundColor: "#1a1b1c", borderRadius: "10px", padding: "4px", border: "1px solid rgba(255,255,255,0.06)" }}>
              {RANGE_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setRange(t.value)}
                  style={{
                    padding: "6px 14px", borderRadius: "7px", border: "none",
                    backgroundColor: range === t.value ? "rgba(255,255,255,0.1)" : "transparent",
                    color: range === t.value ? "#fff" : "#888",
                    cursor: "pointer", fontSize: "13px", fontWeight: 500,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleExport}
              disabled={exporting || exported || !data}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 16px", borderRadius: "10px",
                backgroundColor: exported ? "#4ae176" : "#1a1b1c",
                border: exported ? "1px solid #4ae176" : "1px solid rgba(255,255,255,0.06)",
                color: exported ? "#121314" : "#fff",
                cursor: "pointer", fontSize: "13px", fontWeight: 500, height: "38px",
              }}
            >
              {exporting ? (
                <span style={{ width: 14, height: 14, border: "2px solid #888", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : exported ? (
                <span>✓ Exported</span>
              ) : (
                <><Download size={14} /> Export CSV</>
              )}
            </button>
          </div>
        </div>

        {loading || !data ? (
          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ ...card, height: "104px" }} />
              ))}
            </div>
            <div style={{ ...card, height: "320px" }} />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "16px" }}>
              {[
                { label: "Total Messages", value: data.stats.totalMessages.toLocaleString(), delta: data.deltas.totalMessages, icon: MessagesSquare },
                { label: "New Conversations", value: data.stats.totalConversations.toLocaleString(), delta: data.deltas.totalConversations, icon: Languages },
                { label: "Avg Reply Time", value: `${data.stats.avgReplyMinutes}m`, delta: data.deltas.avgReplyMinutes, lowerIsBetter: true, icon: TrendingDown },
                { label: "Resolution Rate", value: `${data.stats.resolutionRate}%`, delta: data.deltas.resolutionRate, icon: CheckCircle2 },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  style={{ ...card, padding: "18px 20px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#888", fontSize: "12px", marginBottom: "10px" }}>
                    <s.icon size={13} /> {s.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                    <span style={{ fontSize: "26px", fontWeight: 700, color: "#fff" }}>{s.value}</span>
                    <DeltaBadge value={s.delta} lowerIsBetter={s.lowerIsBetter} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Main Chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              style={{ ...card, padding: "24px", marginBottom: "16px" }}
            >
              <h3 style={{ color: "#fff", fontSize: "15px", fontWeight: 700, marginBottom: "20px" }}>Message Volume</h3>
              <div style={{ height: "280px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartRows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="msgGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ae176" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#4ae176" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatShortDate} />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                    <Area
                      type="monotone" dataKey="messages" stroke="#4ae176" fill="url(#msgGradient)"
                      strokeWidth={2} activeDot={{ r: 5, fill: "#4ae176", stroke: "#121314", strokeWidth: 2 }}
                      isAnimationActive animationDuration={900} animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* 3-panel row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "16px" }}>

              {/* Language Distribution */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} style={{ ...card, padding: "20px" }}>
                <h3 style={{ color: "#fff", fontSize: "13px", fontWeight: 700, marginBottom: "16px" }}>Language Distribution</h3>
                {data.languages.length === 0 ? (
                  <div style={{ color: "#666", fontSize: "13px", textAlign: "center", padding: "40px 0" }}>No bot replies yet</div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "100px", height: "100px", position: "relative", flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data.languages} cx="50%" cy="50%" innerRadius={32} outerRadius={48} paddingAngle={4} dataKey="value" stroke="none" isAnimationActive animationDuration={800}>
                            {data.languages.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                        <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>{data.languagesTotal}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: 0 }}>
                      {data.languages.map((l) => (
                        <div key={l.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                          <span style={{ color: "#aaa", fontSize: "12px", flex: 1 }}>{l.name}</span>
                          <span style={{ color: "#fff", fontSize: "12px", fontWeight: 700 }}>{l.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* New Conversations / Day */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }} style={{ ...card, padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <h3 style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>New Conversations</h3>
                  <DeltaBadge value={data.deltas.totalConversations} />
                </div>
                <div style={{ fontSize: "26px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
                  {data.newConversationsCount.toLocaleString()}
                </div>
                <p style={{ color: "#666", fontSize: "12px", marginBottom: "16px" }}>threads in selected period</p>
                <div style={{ height: "50px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.conversationSparkline}>
                      <Line type="monotone" dataKey="value" stroke="#4ae176" strokeWidth={2} dot={false} isAnimationActive animationDuration={800} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Resolution Split */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} style={{ ...card, padding: "20px" }}>
                <h3 style={{ color: "#fff", fontSize: "13px", fontWeight: 700, marginBottom: "16px" }}>Resolution Overview</h3>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div>
                    <p style={{ color: "#666", fontSize: "11px", marginBottom: "4px" }}>Resolved</p>
                    <p style={{ color: "#4ae176", fontSize: "18px", fontWeight: 700 }}>{data.resolutionSplit.resolved}</p>
                  </div>
                  <div>
                    <p style={{ color: "#666", fontSize: "11px", marginBottom: "4px" }}>Unresolved</p>
                    <p style={{ color: "#fff", fontSize: "18px", fontWeight: 700 }}>{data.resolutionSplit.unresolved}</p>
                  </div>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "999px", height: "8px", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.resolutionSplit.resolvedPct}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      style={{ height: "100%", background: "linear-gradient(90deg,#4ae176,#22c55e)", borderRadius: "999px" }}
                    />
                  </div>
                </div>
                <p style={{ color: "#666", fontSize: "12px" }}>{data.resolutionSplit.resolvedPct}% resolved / {100 - data.resolutionSplit.resolvedPct}% open</p>
              </motion.div>
            </div>

            {/* Recent Conversations */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }}>
              <RecentConversations />
            </motion.div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AppShell>
  )
}