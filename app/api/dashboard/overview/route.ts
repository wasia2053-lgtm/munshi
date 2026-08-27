import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

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
    if (ROMAN_URDU_WORDS.some((w) => lower.includes(w))) return 'Roman Urdu'
    return 'English'
}

function toDateKey(d: Date): string {
    return d.toISOString().split('T')[0]
}

function rangeDays(range: string): number {
    if (range === '7d') return 7
    if (range === '1m') return 30
    if (range === '3m') return 90
    if (range === '6m') return 180
    return 30
}

function pctDelta(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 1000) / 10
}

export async function GET(request: Request) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '1m'
    const business_id = user.id
    const isAllTime = range === 'all'
    const days = rangeDays(range)

    const now = new Date()
    const currentStart = isAllTime
        ? new Date(0) // epoch — includes every record ever created
        : new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
    if (!isAllTime) currentStart.setHours(0, 0, 0, 0)
    // "Previous period" comparison doesn't make sense for all-time — deltas
    // will just be reported as 0 in that case (matches old analytics route).
    const prevStart = isAllTime ? new Date(0) : new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000)
    const prevEnd = isAllTime ? new Date(0) : currentStart

    const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, is_resolved, created_at')
        .eq('business_id', business_id)

    if (convError) {
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    const allConvs = conversations || []
    const convIds = allConvs.map((c: any) => c.id)

    let allMessages: { conversation_id: string; sender: string; content: string; timestamp: string }[] = []
    if (convIds.length > 0) {
        const { data: msgData, error: msgError } = await supabase
            .from('messages')
            .select('conversation_id, sender, content, timestamp')
            .in('conversation_id', convIds)
            .order('timestamp', { ascending: true })

        if (msgError) {
            return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
        }
        allMessages = msgData || []
    }

    const inCurrent = (t: string) => new Date(t) >= currentStart
    const inPrev = (t: string) => new Date(t) >= prevStart && new Date(t) < prevEnd

    const currentMessages = allMessages.filter((m) => inCurrent(m.timestamp))
    const prevMessages = allMessages.filter((m) => inPrev(m.timestamp))
    const currentConvs = allConvs.filter((c: any) => c.created_at && inCurrent(c.created_at))
    const prevConvs = allConvs.filter((c: any) => c.created_at && inPrev(c.created_at))

    // ---- Stat cards ----
    const totalMessages = currentMessages.length
    const totalConversations = currentConvs.length
    const resolvedCount = currentConvs.filter((c: any) => c.is_resolved).length
    const resolutionRate = totalConversations > 0 ? Math.round((resolvedCount / totalConversations) * 100) : 0

    function avgReplyMinutes(msgs: typeof allMessages, convSet: string[]): number {
        const byConv: Record<string, typeof allMessages> = {}
        msgs.forEach((m) => {
            if (!convSet.includes(m.conversation_id)) return
            if (!byConv[m.conversation_id]) byConv[m.conversation_id] = []
            byConv[m.conversation_id].push(m)
        })
        const gaps: number[] = []
        Object.values(byConv).forEach((list) => {
            for (let i = 0; i < list.length - 1; i++) {
                if (list[i].sender === 'customer' && list[i + 1].sender === 'bot') {
                    const gap = (new Date(list[i + 1].timestamp).getTime() - new Date(list[i].timestamp).getTime()) / 1000
                    if (gap >= 0 && gap < 300) gaps.push(gap)
                }
            }
        })
        if (gaps.length === 0) return 0
        return Math.round(((gaps.reduce((a, b) => a + b, 0) / gaps.length) / 60) * 10) / 10
    }

    const avgReplyMinutesCurrent = avgReplyMinutes(currentMessages, convIds)
    const avgReplyMinutesPrev = avgReplyMinutes(prevMessages, convIds)

    const prevResolved = prevConvs.filter((c: any) => c.is_resolved).length
    const prevResolutionRate = prevConvs.length > 0 ? Math.round((prevResolved / prevConvs.length) * 100) : 0

    const deltas = isAllTime
        ? { totalMessages: 0, totalConversations: 0, avgReplyMinutes: 0, resolutionRate: 0 }
        : {
            totalMessages: pctDelta(totalMessages, prevMessages.length),
            totalConversations: pctDelta(totalConversations, prevConvs.length),
            avgReplyMinutes: pctDelta(avgReplyMinutesCurrent, avgReplyMinutesPrev),
            resolutionRate: pctDelta(resolutionRate, prevResolutionRate),
        }

    // ---- Main chart: messages per day ----
    const chartRows: { date: string; messages: number }[] = []
    const dailyMsgCounts: Record<string, number> = {}
    currentMessages.forEach((m) => {
        const key = toDateKey(new Date(m.timestamp))
        dailyMsgCounts[key] = (dailyMsgCounts[key] || 0) + 1
    })
    if (isAllTime) {
        Object.entries(dailyMsgCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([date, messages]) => chartRows.push({ date, messages }))
    } else {
        for (let i = 0; i < days; i++) {
            const d = new Date(currentStart.getTime() + i * 24 * 60 * 60 * 1000)
            const key = toDateKey(d)
            chartRows.push({ date: key, messages: dailyMsgCounts[key] || 0 })
        }
    }

    // ---- New conversations per day (sparkline panel) ----
    const dailyConvCounts: Record<string, number> = {}
    currentConvs.forEach((c: any) => {
        const key = toDateKey(new Date(c.created_at))
        dailyConvCounts[key] = (dailyConvCounts[key] || 0) + 1
    })
    const conversationSparkline: { value: number }[] = []
    if (isAllTime) {
        Object.entries(dailyConvCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([, count]) => conversationSparkline.push({ value: count }))
    } else {
        for (let i = 0; i < days; i++) {
            const d = new Date(currentStart.getTime() + i * 24 * 60 * 60 * 1000)
            const key = toDateKey(d)
            conversationSparkline.push({ value: dailyConvCounts[key] || 0 })
        }
    }

    // ---- Language distribution (donut) ----
    const langCounts: Record<string, number> = { 'Roman Urdu': 0, English: 0, Arabic: 0 }
    currentMessages
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
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value, color: langColors[name] }))
    const languagesTotal = languages.reduce((a, b) => a + b.value, 0)

    // ---- Resolution split ----
    const unresolvedCount = totalConversations - resolvedCount

    return NextResponse.json({
        stats: {
            totalMessages,
            totalConversations,
            avgReplyMinutes: avgReplyMinutesCurrent,
            resolutionRate,
        },
        deltas,
        chartRows,
        conversationSparkline,
        newConversationsCount: totalConversations,
        languages,
        languagesTotal,
        resolutionSplit: {
            resolved: resolvedCount,
            unresolved: unresolvedCount,
            resolvedPct: totalConversations > 0 ? Math.round((resolvedCount / totalConversations) * 100) : 0,
        },
    })
}