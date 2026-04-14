'use client';

import { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Conversation {
  id: string;
  customer_phone: string;
  last_message: string;
  last_message_time: string;
  business_id: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  customer_phone: string;
  message_text: string;
  message_type: 'incoming' | 'outgoing';
  created_at: string;
  whatsapp_message_id?: string;
}

// ─── Sidebar Links ─────────────────────────────────────────────────────────────
const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/dashboard/whatsapp', label: 'WhatsApp', icon: '📱' },
  { href: '/dashboard/training', label: 'Train Bot', icon: '🧠' },
  { href: '/dashboard/conversations', label: 'Conversations', icon: '💬', active: true },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ConversationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [panelView, setPanelView] = useState<'list' | 'chat'>('list'); // mobile toggle
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Fetch conversations ──
  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    try {
      setLoading(true);
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setConversations(data.conversations || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Fetch messages ──
  async function fetchMessages(conv: Conversation) {
    setSelectedConv(conv);
    setMessages([]);
    setMessagesLoading(true);
    setPanelView('chat');
    try {
      const res = await fetch(`/api/conversations/${conv.id}/messages`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load messages');
      setMessages(data.messages || []);
    } catch (e: any) {
      console.error('Messages error:', e);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filtered = conversations.filter(c =>
    c.customer_phone?.includes(search) ||
    c.last_message?.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Sidebar ───────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        style={{ backgroundColor: '#102C26' }}
        className={`
          fixed top-0 left-0 h-full z-40 w-64 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:flex lg:flex-shrink-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div
            style={{ backgroundColor: '#D4A853' }}
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base"
            className2="text-[#102C26]"
          >
            <span style={{ color: '#102C26', fontWeight: 800, fontSize: '16px' }}>M</span>
          </div>
          <span className="text-white font-bold text-lg tracking-wide">MUNSHI</span>
          <button
            className="ml-auto lg:hidden text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              style={link.active ? { backgroundColor: '#D4A853', color: '#102C26' } : {}}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-150
                ${link.active
                  ? 'font-semibold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }
              `}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
              {link.active && (
                <span
                  style={{ backgroundColor: '#102C26', color: '#D4A853' }}
                  className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
                >
                  {conversations.length}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div
            style={{ backgroundColor: 'rgba(212,168,83,0.15)', borderColor: '#D4A853' }}
            className="rounded-xl p-3 border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/60">FREE PLAN</span>
              <span style={{ color: '#D4A853' }} className="text-xs font-bold">Upgrade</span>
            </div>
            <div className="text-xs text-white/50">Messages: 2 / 500</div>
            <div className="mt-1.5 h-1.5 rounded-full bg-white/10">
              <div style={{ width: '0.4%', backgroundColor: '#D4A853' }} className="h-full rounded-full" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 px-1">
            <div
              style={{ backgroundColor: '#D4A853' }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            >
              <span style={{ color: '#102C26' }}>W</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs text-white font-medium truncate">User</div>
              <div className="text-xs text-white/40 truncate">wasia2053@gmail.com</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );

  // ─── Conversations List Panel ──────────────────────────────────────────────
  const ConvList = () => (
    <div
      style={{ borderColor: 'rgba(16,44,38,0.1)' }}
      className={`
        flex flex-col h-full
        ${panelView === 'chat' ? 'hidden md:flex' : 'flex'}
        w-full md:w-80 lg:w-96 border-r flex-shrink-0
      `}
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
            <button
              onClick={fetchConversations}
              className="text-white/50 hover:text-white text-sm ml-2"
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search karo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
        <div className="mt-2 text-xs text-white/40">
          {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F7E7CE08' }}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-2"
                style={{ borderColor: '#D4A853', borderTopColor: 'transparent' }}
              />
              <p className="text-sm" style={{ color: '#102C26' + '80' }}>Loading...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <button
              onClick={fetchConversations}
              style={{ backgroundColor: '#D4A853', color: '#102C26' }}
              className="text-xs px-4 py-2 rounded-lg font-semibold"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm font-medium" style={{ color: '#102C26' }}>Abhi tak koi conversation nahi</p>
            <p className="text-xs mt-1 text-gray-400">WhatsApp pe message aane ka wait karo</p>
          </div>
        ) : (
          filtered.map(conv => (
            <button
              key={conv.id}
              onClick={() => fetchMessages(conv)}
              className="w-full text-left transition-all duration-150"
              style={{
                backgroundColor: selectedConv?.id === conv.id ? 'rgba(212,168,83,0.12)' : 'transparent',
                borderLeft: selectedConv?.id === conv.id ? '3px solid #D4A853' : '3px solid transparent',
              }}
            >
              <div className="flex items-start gap-3 px-5 py-4 hover:bg-black/5">
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: '#102C26', color: '#D4A853' }}
                >
                  {shortPhone(conv.customer_phone).slice(0, 2)}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate" style={{ color: '#102C26' }}>
                      +{conv.customer_phone}
                    </span>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                      {formatTime(conv.last_message_time || conv.updated_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {conv.last_message || 'No messages yet'}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  // ─── Chat Panel ────────────────────────────────────────────────────────────
  const ChatPanel = () => (
    <div
      className={`
        flex-1 flex flex-col h-full min-w-0
        ${panelView === 'list' ? 'hidden md:flex' : 'flex'}
      `}
      style={{ backgroundColor: '#F7E7CE' }}
    >
      {selectedConv ? (
        <>
          {/* Chat Header */}
          <div
            style={{ backgroundColor: '#102C26', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            className="px-5 py-4 flex items-center gap-3 flex-shrink-0"
          >
            {/* Mobile back button */}
            <button
              className="md:hidden text-white/70 hover:text-white mr-1"
              onClick={() => setPanelView('list')}
            >
              ← 
            </button>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: '#D4A853', color: '#102C26' }}
            >
              {shortPhone(selectedConv.customer_phone).slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm">+{selectedConv.customer_phone}</div>
              <div className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Bot Active
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/40">
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-5 space-y-3"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(16,44,38,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(212,168,83,0.06) 0%, transparent 50%)',
            }}
          >
            {messagesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div
                  className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: '#102C26', borderTopColor: 'transparent' }}
                />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-60">
                <div className="text-5xl mb-4">💬</div>
                <p className="text-sm font-medium" style={{ color: '#102C26' }}>No messages found</p>
                <p className="text-xs text-gray-500 mt-1">
                  Messages table check karo Supabase mein
                </p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.message_type === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[75%] md:max-w-[65%] px-4 py-2.5 rounded-2xl text-sm shadow-sm"
                    style={
                      msg.message_type === 'outgoing'
                        ? {
                            backgroundColor: '#102C26',
                            color: '#F7E7CE',
                            borderBottomRightRadius: '4px',
                          }
                        : {
                            backgroundColor: 'white',
                            color: '#1a1a1a',
                            borderBottomLeftRadius: '4px',
                          }
                    }
                  >
                    <p className="leading-relaxed whitespace-pre-wrap break-words">
                      {msg.message_text}
                    </p>
                    <div
                      className={`text-xs mt-1.5 flex items-center gap-1 ${
                        msg.message_type === 'outgoing' ? 'justify-end text-white/40' : 'justify-end text-gray-400'
                      }`}
                    >
                      {formatChatTime(msg.created_at)}
                      {msg.message_type === 'outgoing' && (
                        <span style={{ color: '#D4A853' }}>✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input (view-only info) */}
          <div
            style={{ backgroundColor: 'white', borderTop: '1px solid rgba(16,44,38,0.1)' }}
            className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
          >
            <div
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-gray-400 select-none"
              style={{ backgroundColor: '#F7E7CE', border: '1px solid rgba(16,44,38,0.1)' }}
            >
              🤖 Bot automatically reply kar raha hai WhatsApp pe
            </div>
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 text-4xl"
            style={{ backgroundColor: 'rgba(16,44,38,0.08)' }}
          >
            💬
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: '#102C26' }}>
            Conversation select karo
          </h3>
          <p className="text-sm text-gray-500">Left se koi customer choose karo</p>
        </div>
      )}
    </div>
  );

  // ─── Page Layout ──────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F7E7CE' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile Top Bar */}
        <div
          style={{ backgroundColor: '#102C26' }}
          className="lg:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white text-xl p-1"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <div
              style={{ backgroundColor: '#D4A853' }}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
            >
              <span style={{ color: '#102C26', fontWeight: 800, fontSize: '13px' }}>M</span>
            </div>
            <span className="text-white font-bold text-base">MUNSHI</span>
          </div>
          {/* Mobile panel toggle */}
          {selectedConv && panelView === 'chat' && (
            <button
              className="ml-auto text-white/60 hover:text-white text-sm"
              onClick={() => setPanelView('list')}
            >
              ← Back
            </button>
          )}
        </div>

        {/* Content Row */}
        <div className="flex flex-1 overflow-hidden">
          <ConvList />
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}