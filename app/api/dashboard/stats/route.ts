import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const business_id = user.id;

  const [businessRes, subRes, settingsRes] = await Promise.all([
    supabase.from('businesses').select('whatsapp_status').eq('id', business_id).single(),
    supabase.from('subscriptions').select('plan, messages_used, messages_limit').eq('user_id', business_id).single(),
    supabase.from('business_settings').select('organization_name').eq('business_id', business_id).single()
  ]);

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, customer_phone, last_message, last_message_time, created_at')
    .eq('business_id', business_id)
    .order('last_message_time', { ascending: false });

  const convIds = (conversations || []).map((c: any) => c.id);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let messages: any[] = [];
  if (convIds.length > 0) {
    const { data: msgData } = await supabase
      .from('messages')
      .select('id, conversation_id, sender, content, timestamp')
      .in('conversation_id', convIds)
      .gte('timestamp', thirtyDaysAgo.toISOString())
      .order('timestamp', { ascending: true });
    messages = msgData || [];
  }

  // All-time total message count
  let allTimeMessageCount = 0;
  if (convIds.length > 0) {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convIds);
    allTimeMessageCount = count || 0;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const totalMessagesThisMonth = allTimeMessageCount;

  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(startOfMonth.getTime() - 1);
  const lastMonthMessages = messages.filter((m: any) => {
    const t = new Date(m.timestamp);
    return t >= startOfLastMonth && t <= endOfLastMonth;
  }).length;
  const messagesChangePercent = null;

  const activeLeadsThisMonth = new Set(
    (conversations || [])
      .filter((c: any) => c.last_message_time && new Date(c.last_message_time) >= startOfMonth)
      .map((c: any) => c.customer_phone)
  ).size;

  const responseTimes: number[] = [];
  const byConv: Record<string, any[]> = {};
  for (const m of messages) {
    if (!byConv[m.conversation_id]) byConv[m.conversation_id] = [];
    byConv[m.conversation_id].push(m);
  }
  for (const convId in byConv) {
    const msgs = byConv[convId];
    for (let i = 0; i < msgs.length - 1; i++) {
      if (msgs[i].sender === 'customer' && msgs[i + 1].sender === 'bot') {
        const gap = (new Date(msgs[i + 1].timestamp).getTime() - new Date(msgs[i].timestamp).getTime()) / 1000;
        if (gap >= 0 && gap < 300) responseTimes.push(gap);
      }
    }
  }
  const avgResponseSeconds = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : null;

  const last7Days: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    const count = messages.filter((m: any) => {
      const t = new Date(m.timestamp);
      return t >= d && t <= dayEnd;
    }).length;
    last7Days.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      count,
    });
  }

  const recentConversations = (conversations || []).slice(0, 4).map((c: any) => ({
    id: c.id,
    name: c.customer_phone,
    lastMessage: c.last_message || '',
    time: c.last_message_time,
  }));

  return NextResponse.json({
    organizationName: settingsRes.data?.organization_name || 'My Business',
    whatsappStatus: businessRes.data?.whatsapp_status || 'disconnected',
    plan: subRes.data?.plan || 'free',
    messagesUsed: subRes.data?.messages_used || 0,
    messagesLimit: subRes.data?.messages_limit || 50,
    totalMessagesThisMonth,
    messagesChangePercent,
    activeLeadsThisMonth,
    avgResponseSeconds,
    volumeLast7Days: last7Days,
    recentConversations,
  });
}