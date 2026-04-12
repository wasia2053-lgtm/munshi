'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface Conversation {
  id: string;
  customer_phone: string;
  last_message: string;
  last_message_time: string;
  updated_at: string;
}

interface Message {
  id: string;
  message_text: string;
  message_type: 'incoming' | 'outgoing';
  created_at: string;
}

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return 'Abhi';
  if (mins < 60) return `${mins}m pehle`;
  if (hrs < 24) return `${hrs}h pehle`;
  return `${days}d pehle`;
}

function formatTime(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(phone: string) {
  return phone ? phone.slice(-2) : '??';
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConversations(data);
      setError(null);
      // Auto-select first if none selected
      if (data.length > 0 && !selected) {
        setSelected(data[0]);
      }
    } catch (err: any) {
      console.error('Conversations fetch error:', err);
      setError(err.message);
    } finally {
      setLoadingConvs(false);
    }
  }, [selected]);

  // Initial fetch + polling every 10s
  useEffect(() => {
    fetchConversations();
    pollRef.current = setInterval(fetchConversations, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Messages fetch error:', err);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetchMessages(selected.id);
    // Poll messages every 5s
    const interval = setInterval(() => fetchMessages(selected.id), 5000);
    return () => clearInterval(interval);
  }, [selected, fetchMessages]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filtered = conversations.filter(c =>
    c.customer_phone?.toLowerCase().includes(search.toLowerCase()) ||
    (c.last_message || '').toLowerCase().includes(search.toLowerCase())
  );

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach(msg => {
    const d = formatDate(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === d) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date: d, msgs: [msg] });
    }
  });

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F7F3EC' }}>

      {/* ───── LEFT PANEL ───── */}
      <div
        className="flex flex-col flex-shrink-0"
        style={{
          width: '320px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E8E0D5',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #F0E8DC' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#102C26' }}>
                Conversations
              </h1>
              <p style={{ fontSize: '12px', color: '#9B8E7E', marginTop: '2px' }}>
                {loadingConvs ? 'Loading...' : `${conversations.length} customers`}
              </p>
            </div>
            {/* Green dot = live */}
            <div className="flex items-center gap-1.5">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Live</span>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginTop: '12px' }}>
            <svg
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: '#9B8E7E' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search karo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '32px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                fontSize: '13px',
                backgroundColor: '#F7F3EC',
                border: '1px solid #E8E0D5',
                borderRadius: '8px',
                outline: 'none',
                color: '#102C26',
              }}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs ? (
            <div className="flex flex-col gap-3 p-3">
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: '64px', backgroundColor: '#F7F3EC', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : error ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#DC2626' }}>Error: {error}</p>
              <button
                onClick={fetchConversations}
                style={{ marginTop: '8px', fontSize: '12px', color: '#102C26', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
              <p style={{ fontSize: '13px', color: '#9B8E7E' }}>
                {search ? 'Koi result nahi mila' : 'Abhi tak koi conversation nahi'}
              </p>
            </div>
          ) : (
            filtered.map(conv => {
              const isActive = selected?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelected(conv)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #F5EFE8',
                    borderLeft: isActive ? '3px solid #D4A853' : '3px solid transparent',
                    backgroundColor: isActive ? '#FDF8F0' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    backgroundColor: isActive ? '#D4A853' : '#102C26',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '13px', fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {getInitials(conv.customer_phone)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#102C26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.customer_phone}
                      </span>
                      <span style={{ fontSize: '11px', color: '#9B8E7E', flexShrink: 0, marginLeft: '6px' }}>
                        {timeAgo(conv.updated_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                      {conv.last_message || '—'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ───── RIGHT PANEL ───── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selected ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: '14px 20px',
              backgroundColor: '#102C26',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0,
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                backgroundColor: '#D4A853',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#102C26', fontSize: '13px', fontWeight: 700,
              }}>
                {getInitials(selected.customer_phone)}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#F7E7CE' }}>
                  {selected.customer_phone}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                  <span style={{ fontSize: '11px', color: '#9BC4A8' }}>WhatsApp • Bot active</span>
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{
                  fontSize: '11px', padding: '4px 10px', borderRadius: '20px',
                  backgroundColor: '#D4A85330', color: '#D4A853',
                  border: '1px solid #D4A85360',
                }}>
                  {messages.length} messages
                </span>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '20px 24px',
              backgroundImage: 'radial-gradient(circle at 1px 1px, #D4A85315 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}>
              {loadingMsgs ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      height: '44px', width: i % 2 === 0 ? '60%' : '45%',
                      backgroundColor: '#E8E0D5', borderRadius: '12px',
                      alignSelf: i % 2 === 0 ? 'flex-end' : 'flex-start',
                    }} />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <span style={{ fontSize: '40px' }}>💬</span>
                  <p style={{ fontSize: '14px', color: '#9B8E7E', marginTop: '8px' }}>Koi message nahi abhi tak</p>
                </div>
              ) : (
                groupedMessages.map(group => (
                  <div key={group.date}>
                    {/* Date separator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0 12px' }}>
                      <div style={{ flex: 1, height: '1px', backgroundColor: '#E8E0D5' }} />
                      <span style={{ fontSize: '11px', color: '#9B8E7E', backgroundColor: '#F7F3EC', padding: '2px 10px', borderRadius: '20px' }}>
                        {group.date}
                      </span>
                      <div style={{ flex: 1, height: '1px', backgroundColor: '#E8E0D5' }} />
                    </div>

                    {group.msgs.map(msg => (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: msg.message_type === 'outgoing' ? 'flex-end' : 'flex-start',
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{
                          maxWidth: '68%',
                          padding: '10px 14px',
                          borderRadius: msg.message_type === 'outgoing'
                            ? '18px 18px 4px 18px'
                            : '18px 18px 18px 4px',
                          backgroundColor: msg.message_type === 'outgoing' ? '#102C26' : '#FFFFFF',
                          border: msg.message_type === 'outgoing' ? 'none' : '1px solid #E8E0D5',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                        }}>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.5',
                            color: msg.message_type === 'outgoing' ? '#F7E7CE' : '#1F2937',
                            margin: 0,
                          }}>
                            {msg.message_text}
                          </p>
                          <p style={{
                            fontSize: '10px',
                            marginTop: '4px',
                            textAlign: 'right',
                            color: msg.message_type === 'outgoing' ? '#9BC4A8' : '#9B8E7E',
                            margin: '4px 0 0',
                          }}>
                            {msg.message_type === 'outgoing' ? '🤖 Munshi • ' : ''}{formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 20px',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E8E0D5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div style={{
                flex: 1, padding: '8px 14px',
                backgroundColor: '#F7F3EC', borderRadius: '20px',
                fontSize: '12px', color: '#9B8E7E',
                border: '1px solid #E8E0D5',
              }}>
                🤖 Munshi bot is handling all replies automatically
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: '#9B8E7E',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: '#F7E7CE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', marginBottom: '12px',
            }}>
              💬
            </div>
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#102C26' }}>Conversation select karo</p>
            <p style={{ fontSize: '13px', color: '#9B8E7E', marginTop: '4px' }}>Left se koi customer choose karo</p>
          </div>
        )}
      </div>
    </div>
  );
}