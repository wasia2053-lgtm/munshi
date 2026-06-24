import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const ARABIC_REGEX = /[\u0600-\u06FF]/
const ROMAN_URDU_WORDS = [
  'hai', 'hain', 'kya', 'kyun', 'aap', 'tum', 'mein', 'nahi', 'han', 'acha',
  'theek', 'bhai', 'shukriya', 'kar', 'karo', 'kijiye', 'plz', 'bata',
  'dijiye', 'paisa', 'rupees', 'kese', 'kaise', 'kab', 'kahan', 'wala',
]

function detectLanguage(text: string): 'Arabic' | 'Roman Urdu' | 'English' {
  if (!text) return 'English'
  if (ARABIC_REGEX.test(text)) return 'Arabic'
  const lower = text.toLowerCase()
  const hasUrduWord = ROMAN_URDU_WORDS.some((w) => lower.includes(w))
  if (hasUrduWord) return 'Roman Urdu'
  return 'English'
}

type ConversationRow = {
  id: string
  customer_phone: string | null
  is_resolved: boolean | null
  created_at: string | null
}

type MessageRow = {
  conversation_id: string
  sender: string
  content: string
  timestamp: string
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || '7D'

    let days = 7
    if (filter === '30D') days = 30
    else if (filter === '3M') days = 90
    else if (filter === 'ALL') days = 0

    const { data: allConversations, error: convError } = await supabase
      .from('conversations')
      .select('id, customer_phone, is_resolved, created_at')
      .eq('business_id', user.id)

    if (convError) {
      console.error('Conversations error:', convError)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    const conversations: ConversationRow[] = allConversations || []
    const conversationIds = conversations.map((c) => c.id)

    let allMessages: MessageRow[] = []
    if (conversationIds.length > 0) {
      const { data: msgRows, error: msgError } = await supabase
        .from('messages')
        .select('conversation_id, sender, content, timestamp')
        .in('conversation_id', conversationIds)
        .order('timestamp', { ascending: true })

      if (msgError) {
        console.error('Messages error:', msgError)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
      }
      allMessages = msgRows || []
    }

    const now = new Date()
    const cutoff = days > 0 ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000) : null

    const messages = cutoff
      ? allMessages.filter((m) => new Date(m.timestamp) >= cutoff)
      : allMessages

    const conversationsFiltered = cutoff
      ? conversations.filter((c) => (c.created_at ? new Date(c.created_at) >= cutoff : false))
      : conversations

    const { count: trainingCount } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', user.id)

    const totalMessages = messages.length
    const totalConversations = conversationsFiltered.length
    const botMessages = messages.filter((m) => m.sender === 'bot').length
    const customerMessages = messages.filter((m) => m.sender === 'customer').length

    const resolvedCount = conversationsFiltered.filter((c) => c.is_resolved).length
    const resolutionRate =
      totalConversations > 0 ? Math.round((resolvedCount / totalConversations) * 100) : 0

    const avgMessagesPerConv =
      totalConversations > 0 ? Math.round((totalMessages / totalConversations) * 10) / 10 : 0

    const hourCounts = new Array(24).fill(0)
    messages.forEach((m) => {
      const h = new Date(m.timestamp).getHours()
      hourCounts[h]++
    })
    let peakHour = 0
    let peakCount = -1
    hourCounts.forEach((c, h) => {
      if (c > peakCount) {
        peakCount = c
        peakHour = h
      }
    })

    const phoneCounts: Record<string, number> = {}
    conversationsFiltered.forEach((c) => {
      if (c.customer_phone) phoneCounts[c.customer_phone] = (phoneCounts[c.customer_phone] || 0) + 1
    })
    const uniqueCustomers = Object.keys(phoneCounts).length
    const repeatCustomers = Object.values(phoneCounts).filter((v) => v >= 2).length
    const repeatCustomersPct =
      uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0

    const dailyMap: Record<string, { resolved: number; unresolved: number }> = {}
    conversationsFiltered.forEach((c) => {
      const dateKey = (c.created_at ? new Date(c.created_at) : new Date())
        .toISOString()
        .split('T')[0]
      if (!dailyMap[dateKey]) dailyMap[dateKey] = { resolved: 0, unresolved: 0 }
      if (c.is_resolved) dailyMap[dateKey].resolved++
      else dailyMap[dateKey].unresolved++
    })
    const msgData = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, resolved: v.resolved, unresolved: v.unresolved }))

    const heatmapMap: Record<string, number> = {}
    messages.forEach((m) => {
      const d = new Date(m.timestamp)
      const key = `${d.getDay()}-${d.getHours()}`
      heatmapMap[key] = (heatmapMap[key] || 0) + 1
    })
    const heatmap = Object.entries(heatmapMap).map(([key, count]) => {
      const [day, hour] = key.split('-').map(Number)
      return { day, hour, count }
    })

    const langCounts: Record<string, number> = { 'Roman Urdu': 0, English: 0, Arabic: 0 }
    messages
      .filter((m) => m.sender === 'bot')
      .forEach((m) => {
        const lang = detectLanguage(m.content)
        langCounts[lang] = (langCounts[lang] || 0) + 1
      })
    const langColors: Record<string, string> = {
      'Roman Urdu': '#4ae176',
      English: '#2dd4d4',
      Arabic: '#d4a853',
    }
    const languages = Object.entries(langCounts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value, color: langColors[name] }))

    const dayBuckets: { date: string; messages: number; resolved: number; total: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      dayBuckets.push({ date: d.toISOString().split('T')[0], messages: 0, resolved: 0, total: 0 })
    }
    allMessages.forEach((m) => {
      const dateKey = new Date(m.timestamp).toISOString().split('T')[0]
      const bucket = dayBuckets.find((b) => b.date === dateKey)
      if (bucket) bucket.messages++
    })
    conversations.forEach((c) => {
      if (!c.created_at) return
      const dateKey = new Date(c.created_at).toISOString().split('T')[0]
      const bucket = dayBuckets.find((b) => b.date === dateKey)
      if (bucket) {
        bucket.total++
        if (c.is_resolved) bucket.resolved++
      }
    })
    const sparklines = {
      resolutionRate: dayBuckets.map((b) => ({
        value: b.total > 0 ? Math.round((b.resolved / b.total) * 100) : 0,
      })),
      avgMessages: dayBuckets.map((b) => ({
        value: b.total > 0 ? Math.round((b.messages / b.total) * 10) / 10 : 0,
      })),
      peakHour: dayBuckets.map((b) => ({ value: b.messages })),
      repeatCustomers: dayBuckets.map((b) => ({ value: b.total })),
    }

    let deltaResolutionRate = 0
    let deltaAvgMessages = 0
    if (days > 0 && cutoff) {
      const prevStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000)
      const prevConversations = conversations.filter((c) => {
        if (!c.created_at) return false
        const t = new Date(c.created_at)
        return t >= prevStart && t < cutoff
      })
      const prevMessages = allMessages.filter((m) => {
        const t = new Date(m.timestamp)
        return t >= prevStart && t < cutoff
      })
      const prevResolved = prevConversations.filter((c) => c.is_resolved).length
      const prevTotal = prevConversations.length
      const prevResolutionRate = prevTotal > 0 ? (prevResolved / prevTotal) * 100 : 0
      const prevAvgMsgs = prevTotal > 0 ? prevMessages.length / prevTotal : 0

      deltaResolutionRate = Math.round(resolutionRate - prevResolutionRate)
      deltaAvgMessages = Math.round((avgMessagesPerConv - prevAvgMsgs) * 10) / 10
    }

    return NextResponse.json({
      stats: {
        totalMessages,
        totalConversations,
        trainingCount: trainingCount || 0,
        resolutionRate,
        avgMessagesPerConv,
        peakHour,
        repeatCustomersPct,
      },
      deltas: {
        resolutionRate: deltaResolutionRate,
        avgMessagesPerConv: deltaAvgMessages,
        peakHour: 0,
        repeatCustomersPct: 0,
      },
      msgData,
      heatmap,
      languages,
      sparklines,
      bot_messages: botMessages,
      customer_messages: customerMessages,
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}