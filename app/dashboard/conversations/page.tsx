'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { LogoCompact } from '@/components/logos';
import { SkeletonCard } from '@/components/SkeletonLoader'
import EmptyState from '@/components/EmptyState'
import SidebarProfile from '@/components/SidebarProfile'

interface Conversation {
  id: string;
  customer_phone: string;
  last_message: string;
  last_message_time: string;
  business_id: string;
  created_at: string;
  updated_at: string;
  is_resolved?: boolean;
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender: 'bot' | 'customer';
  timestamp: string;
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/dashboard/whatsapp', label: 'WhatsApp', icon: '📱' },
  { href: '/dashboard/training', label: 'Train Bot', icon: '🧠' },
  { href: '/dashboard/conversations', label: 'Conversations', icon: '💬', active: true },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
  { href: '/dashboard/billing', label: 'Billing', icon: '💳' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

function formatChatTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function shortPhone(phone: string) {
  return phone?.replace(/\D/g, '').slice(-10) || '—';
}

export default function ConversationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [panelView, setPanelView] = useState<'list' | 'chat'>('list');
  const [msgCount, setMsgCount] = useState(0);
  const [resolving, setResolving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetch('/api/usage/message-count', { credentials: 'include' })
      .then(r => r.json()).then(d => setMsgCount(d.count || 0));
  }, []);

  async function fetchConversations() {
    try {
      setLoading(true);
      const res = await fetch('/api/conversations', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setConversations(data.conversations || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(conv: Conversation) {
    setSelectedConv(conv);
    setMessages([]);
    setMessagesLoading(true);
    setPanelView('chat');
    try {
      const res = await fetch(`/api/conversations/${conv.id}/messages`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessages(data.messages || []);
    } catch (e: any) {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }

  async function toggleResolved(conv: Conversation) {
    setResolving(true);
    try {
      const newStatus = !conv.is_resolved;
      const res = await fetch(`/api/conversations/${conv.id}/resolve`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_resolved: newStatus }),
      });
      if (res.ok) {
        setConversations(prev =>
          prev.map(c => c.id === conv.id ? { ...c, is_resolved: newStatus } : c)
        );
        setSelectedConv(prev => prev ? { ...prev, is_resolved: newStatus } : prev);
      }
    } catch (e) {
      console.error('Resolve error:', e);
    } finally {
      setResolving(false);
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filtered = conversations.filter(c => {
    const matchSearch = c.customer_phone?.includes(search) ||
      c.last_message?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true :
      filter === 'resolved' ? c.is_resolved :
      !c.is_resolved;
    return matchSearch && matchFilter;
  });

  const resolvedCount = conversations.filter(c => c.is_resolved).length;
  const openCount = conversations.filter(c => !c.is_resolved).length;

  // ─── Sidebar ───────────────────────────────────────────────────
  const Sidebar = () => (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        style={{ backgroundColor: '#0D2420' }}
        className={`fixed top-0 left-0 h-full z-40 w-64 flex flex-col transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex lg:flex-shrink-0`}
      >
        <div style={{ padding: '20px 16px 16px 16px' }}>
          <LogoCompact />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              style={link.active ? { backgroundColor: '#D4A853', color: '#102C26' } : {}}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${link.active ? 'font-semibold' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
              {link.active && (
                <span style={{ backgroundColor: '#102C26', color: '#D4A853' }} className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold">
                  {conversations.length}
                </span>
              )}
            </a>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <div style={{ backgroundColor: 'rgba(212,168,83,0.15)', borderColor: '#D4A853' }} className="rounded-xl p-3 border mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/60">FREE PLAN</span>
              <a href="/dashboard/billing" style={{ color: '#D4A853' }} className="text-xs font-bold">Upgrade</a>
            </div>
            <div className="text-xs text-white/50">Messages: {msgCount} / 500</div>
            <div className="mt-1.5 h-1.5 rounded-full bg-white/10">
              <div style={{ width: `${Math.min((msgCount/500)*100, 100)}%`, backgroundColor: '#D4A853' }} className="h-full rounded-full" />
            </div>
          </div>
          <SidebarProfile />
        </div>
      </aside>
    </>
  );

  // ─── Conversation List ─────────────────────────────────────────
  const ConvList = () => (
    <div
      style={{ borderRight: '1px solid rgba(42,74,66,0.3)' }}
      className={`flex flex-col h-full ${panelView === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-shrink-0`}
    >
      {/* Header */}
      <div style={{ backgroundColor: '#102C26' }} className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-white font-bold text-lg">Conversations</h1>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Live</span>
            </span>
            <button onClick={fetchConversations} className="text-white/50 hover:text-white text-sm ml-1" title="Refresh">↻</button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Phone ya message search karo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: `All (${conversations.length})` },
            { key: 'open', label: `Open (${openCount})` },
            { key: 'resolved', label: `Resolved (${resolvedCount})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              style={{
                background: filter === f.key ? '#D4A853' : 'rgba(255,255,255,0.08)',
                color: filter === f.key ? '#102C26' : 'rgba(255,255,255,0.6)',
              }}
              className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-all"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F7E7CE08' }}>
        {loading ? (
          <div className="space-y-3 p-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#1a3a34' }}>
                <div className="w-10 h-10 rounded-full bg-gray-600 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-600 rounded animate-pulse" />
                  <div className="h-3 bg-gray-600 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button onClick={fetchConversations} style={{ backgroundColor: '#D4A853', color: '#102C26' }} className="text-xs px-4 py-2 rounded-lg font-semibold">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="💬" title="Koi conversation nahi" description="Jab customers message karenge yahan dikhega" />
        ) : (
          filtered.map(conv => (
            <button
              key={conv.id}
              onClick={() => fetchMessages(conv)}
              className="w-full text-left transition-all duration-150"
              style={{
                backgroundColor: selectedConv?.id === conv.id ? 'rgba(212,168,83,0.12)' : 'transparent',
                borderLeft: selectedConv?.id === conv.id ? '3px solid #D4A853' : '3px solid transparent',
                opacity: conv.is_resolved ? 0.6 : 1,
              }}
            >
              <div className="flex items-start gap-3 px-5 py-4 hover:bg-black/5">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: conv.is_resolved ? '#2A4A42' : '#102C26', color: '#D4A853' }}
                >
                  {shortPhone(conv.customer_phone).slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-sm truncate" style={{ color: '#102C26' }}>
                      +{conv.customer_phone}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {conv.is_resolved && (
                        <span style={{ background: 'rgba(76,175,130,0.15)', color: '#4CAF82', border: '1px solid rgba(76,175,130,0.3)' }} className="text-xs px-1.5 py-0.5 rounded-full">
                          ✓
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{formatTime(conv.last_message_time || conv.updated_at)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message || 'No messages'}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  // ─── Chat Panel ────────────────────────────────────────────────
  const ChatPanel = () => (
    <div
      className={`flex-1 flex flex-col h-full min-w-0 ${panelView === 'list' ? 'hidden md:flex' : 'flex'}`}
      style={{ backgroundColor: '#F7E7CE' }}
    >
      {selectedConv ? (
        <>
          {/* Chat Header */}
          <div
            style={{ backgroundColor: '#102C26', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            className="px-5 py-4 flex items-center gap-3 flex-shrink-0"
          >
            <button className="md:hidden text-white/70 hover:text-white mr-1" onClick={() => setPanelView('list')}>←</button>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ backgroundColor: '#D4A853', color: '#102C26' }}>
              {shortPhone(selectedConv.customer_phone).slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm">+{selectedConv.customer_phone}</div>
              <div className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Bot Active
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">{messages.length} msgs</span>
              {/* Mark Resolved Button */}
              <button
                onClick={() => toggleResolved(selectedConv)}
                disabled={resolving}
                style={{
                  background: selectedConv.is_resolved ? 'rgba(76,175,130,0.2)' : 'rgba(212,168,83,0.15)',
                  color: selectedConv.is_resolved ? '#4CAF82' : '#D4A853',
                  border: `1px solid ${selectedConv.is_resolved ? 'rgba(76,175,130,0.4)' : 'rgba(212,168,83,0.3)'}`,
                }}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 disabled:opacity-50"
              >
                {resolving ? '...' : selectedConv.is_resolved ? '✓ Resolved' : '○ Mark Resolved'}
              </button>
            </div>
          </div>

          {/* Resolved Banner */}
          {selectedConv.is_resolved && (
            <div style={{ background: 'rgba(76,175,130,0.1)', borderBottom: '1px solid rgba(76,175,130,0.2)' }} className="px-5 py-2 flex items-center justify-between">
              <span style={{ color: '#4CAF82' }} className="text-xs font-medium">✓ Yeh conversation resolved mark hai</span>
              <button onClick={() => toggleResolved(selectedConv)} style={{ color: '#8A7560' }} className="text-xs underline">Reopen</button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#102C26', borderTopColor: 'transparent' }} />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-60">
                <div className="text-5xl mb-4">💬</div>
                <p className="text-sm font-medium" style={{ color: '#102C26' }}>No messages found</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'bot' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[75%] md:max-w-[65%] px-4 py-2.5 rounded-2xl text-sm shadow-sm"
                    style={msg.sender === 'bot'
                      ? { backgroundColor: '#102C26', color: '#F7E7CE' }
                      : { backgroundColor: 'white', color: '#102C26', border: '1px solid rgba(16,44,38,0.1)' }
                    }
                  >
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={`text-xs mt-1.5 flex items-center gap-1 ${msg.sender === 'bot' ? 'justify-end text-white/40' : 'justify-end text-gray-400'}`}>
                      {formatChatTime(msg.timestamp)}
                      {msg.sender === 'bot' && <span style={{ color: '#D4A853' }}>✓✓</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Info */}
          <div style={{ backgroundColor: 'white', borderTop: '1px solid rgba(16,44,38,0.1)' }} className="px-4 py-3 flex-shrink-0">
            <div className="flex-1 px-4 py-2.5 rounded-xl text-sm text-gray-400 text-center" style={{ backgroundColor: '#F7E7CE' }}>
              🤖 Bot automatically reply kar raha hai WhatsApp pe
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 text-4xl" style={{ backgroundColor: 'rgba(16,44,38,0.08)' }}>💬</div>
          <h3 className="text-lg font-bold mb-2" style={{ color: '#102C26' }}>Conversation select karo</h3>
          <p className="text-sm text-gray-500">Left se koi customer choose karo</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F7E7CE' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <div style={{ backgroundColor: '#102C26' }} className="lg:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-white text-xl p-1">☰</button>
          <div className="flex items-center gap-2">
            <div style={{ backgroundColor: '#D4A853' }} className="w-7 h-7 rounded-lg flex items-center justify-center">
              <span style={{ color: '#102C26', fontWeight: 800, fontSize: '13px' }}>M</span>
            </div>
            <span className="text-white font-bold text-base">MUNSHI</span>
          </div>
          {selectedConv && panelView === 'chat' && (
            <button className="ml-auto text-white/60 hover:text-white text-sm" onClick={() => setPanelView('list')}>← Back</button>
          )}
        </div>
        <div className="flex flex-1 overflow-hidden">
          <ConvList />
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}