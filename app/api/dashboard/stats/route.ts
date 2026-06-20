import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server'

function getStartDate(range: string): Date | null {
  if (range === 'all') return null;
  const days = Number(range) || 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '30';
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
  const startDate = getStartDate(range);

  let messages: any[] = [];
  if (convIds.length > 0) {
    let query = supabase
      .from('messages')
      .select('id, conversation_id, sender, content, timestamp')
      .in('conversation_id', convIds)
      .order('timestamp', { ascending: true });

    if (startDate) {
      query = query.gte('timestamp', startDate.toISOString());
    }

    const { data: msgData } = await query;
    messages = msgData || [];
  }

  const totalMessages = messages.length;

  const activeLeads = new Set(
    (conversations || [])
      .filter((c: any) => {
        if (!c.last_message_time) return false;
        if (!startDate) return true;
        return new Date(c.last_message_time) >= startDate;
      })
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
    totalMessages,
    activeLeads,
    avgResponseSeconds,
    recentConversations,
  });
}