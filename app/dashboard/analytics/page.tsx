"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { DashboardStats } from "@/components/stats"
import { ConversationVolumeChart } from "@/components/conversation-volume-chart"
import { FirstReplyTimeChart } from "@/components/first-reply-time-chart"
import { RecentConversations } from "@/components/recent-conversations"
import { SupportActivity } from "@/components/support-activity"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download } from "lucide-react"

export type RangeOption = "7" | "30" | "60" | "180" | "365" | "all"

// Escapes a value for safe CSV embedding.
function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeOption>("30")
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)

  // Pulls the same live data the charts are already showing (volume +
  // reply-time), merges into rows, and downloads as CSV. No separate
  // "export" dataset — what you see is what you export.
  async function handleExport() {
    setExporting(true)
    try {
      const [volRes, replyRes] = await Promise.all([
        fetch(`/api/dashboard/volume?days=${range}`, { credentials: "include" }),
        fetch(`/api/dashboard/reply-time?days=${range}`, { credentials: "include" }),
      ])
      const volData = await volRes.json()
      const replyData = await replyRes.json()

      const volRows: { date: string; conversations: number }[] = volData.rows || []
      const replyRows: { day: string; minutes: number }[] = replyData.rows || []

      const rows = [["Date", "New Conversations", "Avg Reply Time (min)"]]
      const maxLen = Math.max(volRows.length, replyRows.length)
      for (let i = 0; i < maxLen; i++) {
        const date = volRows[i]?.date || replyRows[i]?.day || ""
        const convs = volRows[i]?.conversations ?? ""
        const mins = replyRows[i]?.minutes ?? ""
        rows.push([csvEscape(date), csvEscape(String(convs)), csvEscape(String(mins))])
      }

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

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Analytics</h1>
            <p className="text-sm text-muted-foreground">Every conversation, decoded.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select onValueChange={(v) => setRange(v as RangeOption)} value={range}>
              <SelectTrigger aria-label="Analytics time range" className="w-fit" size="sm">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last 1 year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={handleExport}
              disabled={exporting || exported}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground disabled:opacity-60"
            >
              {exporting ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-foreground" />
              ) : exported ? (
                <span>✓ Exported</span>
              ) : (
                <>
                  <Download className="size-3.5" />
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStats range={range} />
          <ConversationVolumeChart range={range} />
          <FirstReplyTimeChart range={range} />
          <RecentConversations />
          <SupportActivity />
        </div>
      </div>
    </AppShell>
  )
}