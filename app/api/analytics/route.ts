import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Get authenticated user
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

    // Get filter parameter
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || '7D'
    
    // Calculate days based on filter
    let days = 7
    if (filter === '30D') days = 30
    else if (filter === '3M') days = 90
    else if (filter === 'ALL') days = 0

    // Get conversations count
    const { count: totalConversations, error: convError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', user.id)

    if (convError) {
      console.error('Conversations count error:', convError)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    // Get conversation IDs for messages count
    const { data: convIds, error: convIdsError } = await supabase
      .from('conversations')
      .select('id')
      .eq('business_id', user.id)

    if (convIdsError) {
      console.error('Conversation IDs error:', convIdsError)
      return NextResponse.json({ error: 'Failed to fetch conversation IDs' }, { status: 500 })
    }

    // Get messages count and bot/customer breakdown
    const conversationIds = convIds?.map(c => c.id) || []
    let totalMessages = 0
    let botMessages = 0
    let customerMessages = 0

    if (conversationIds.length > 0) {
      const { count: msgCount, error: msgError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)

      if (msgError) {
        console.error('Messages count error:', msgError)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
      }

      totalMessages = msgCount || 0

      // Count bot messages
      const { count: botCount, error: botError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('sender', 'bot')

      if (!botError) {
        botMessages = botCount || 0
      }

      // Count customer messages
      const { count: customerCount, error: customerError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('sender', 'customer')

      if (!customerError) {
        customerMessages = customerCount || 0
      }
    }

    // Get knowledge base count
    const { count: trainingCount, error: kbError } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', user.id)

    if (kbError) {
      console.error('Knowledge base count error:', kbError)
      return NextResponse.json({ error: 'Failed to fetch training data' }, { status: 500 })
    }

    // Get message data by date
    let msgData: any[] = []
    
    if (conversationIds.length > 0) {
      let query = supabase
        .from('messages')
        .select('timestamp')
        .in('conversation_id', conversationIds)
        .order('timestamp', { ascending: true })

      // Apply date filter if not ALL
      if (days > 0) {
        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - days)
        query = query.gte('timestamp', fromDate.toISOString())
      }

      const { data: messages, error: msgDataError } = await query

      if (msgDataError) {
        console.error('Message data error:', msgDataError)
        return NextResponse.json({ error: 'Failed to fetch message data' }, { status: 500 })
      }

      // Group messages by date
      const groupedByDate: { [key: string]: number } = {}

      messages?.forEach(msg => {
        const date = new Date(msg.timestamp).toISOString().split('T')[0]
        groupedByDate[date] = (groupedByDate[date] || 0) + 1
      })

      // Convert to array format
      msgData = Object.entries(groupedByDate).map(([date, messages]) => ({
        date,
        messages
      }))
    }

    return NextResponse.json({
      stats: {
        totalMessages: totalMessages || 0,
        totalConversations: totalConversations || 0,
        trainingCount: trainingCount || 0
      },
      msgData,
      bot_messages: botMessages || 0,
      customer_messages: customerMessages || 0
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
