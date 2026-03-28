'use client'
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'

type Message = {
  id: string
  conversation_id: string
  sender: string
  content: string
  timestamp: string
}

type Conversation = {
  id: string
  business_id: string
  customer_phone: string
  created_at: string
  updated_at: string
  lastMessage?: string
  messages?: Message[]
}

const filters = ['All', 'Unread', 'Bot Active']

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} days ago`
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<number>(0)
  const [activeFilter, setActiveFilter] = useState('All')
  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch conversations + their messages
  useEffect(() => {
    fetchConversations()

    // Realtime subscription — auto refresh jab naya message aaye
    const channel = supabase
      .channel('conversations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchConversations()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchConversations() {
    setLoading(true)
    try {
      // Get all conversations
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error || !convs) { setLoading(false); return }

      // For each conversation, get messages
      const convsWithMessages = await Promise.all(
        convs.map(async (conv) => {
          const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('timestamp', { ascending: true })

          const messages = msgs || []
          const lastMsg = messages[messages.length - 1]

          return {
            ...conv,
            messages,
            lastMessage: lastMsg?.content || 'No messages yet',
          }
        })
      )

      setConversations(convsWithMessages)
    } catch (e) {
      console.error('Error fetching conversations:', e)
    }
    setLoading(false)
  }

  const current = conversations[selected]

  const handleSelect = (index: number) => {
    setSelected(index)
    setShowChat(true)
  }

  const handleSend = () => {
    if (!messageInput.trim()) return
    setIsTyping(true)
    setTimeout(() => { setIsTyping(false); setMessageInput('') }, 2000)
  }

  return (
    <DashboardLayout
      title="Conversations"
      subtitle={`${conversations.length} total conversations`}
    >
      <style>{`
        .conv-shell {
          display: flex;
          height: calc(100vh - 130px);
          min-height: 500px;
          border: 1px solid #2A4A42;
          border-radius: 20px;
          overflow: hidden;
          background: #102C26;
        }
        .conv-list-panel {
          width: 300px;
          flex-shrink: 0;
          background: #0D2420;
          border-right: 1px solid #2A4A42;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .conv-chat-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }
        .list-header {
          padding: 16px;
          border-bottom: 1px solid #2A4A42;
          flex-shrink: 0;
        }
        .list-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          font-weight: 700;
          color: #F7E7CE;
          margin-bottom: 12px;
        }
        .filter-row {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .filter-row::-webkit-scrollbar { display: none; }
        .filter-btn {
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          white-space: nowrap;
          transition: all 0.18s;
          background: transparent;
          color: #8A7560;
          font-family: 'DM Sans', sans-serif;
        }
        .filter-btn:hover { color: #F7E7CE; }
        .filter-btn.active {
          background: rgba(212,168,83,0.1);
          color: #D4A853;
          border-color: rgba(212,168,83,0.25);
        }
        .conv-items { flex: 1; overflow-y: auto; }
        .conv-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(42,74,66,0.4);
          cursor: pointer;
          transition: background 0.15s;
          border-left: 3px solid transparent;
        }
        .conv-item:hover { background: rgba(247,231,206,0.02); }
        .conv-item.active {
          background: rgba(212,168,83,0.06);
          border-left-color: #D4A853;
        }
        .conv-avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2A4A42, #1A3D35);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
          color: #C4A882;
          font-family: 'Cormorant Garamond', serif;
          flex-shrink: 0;
        }
        .conv-avatar.gold {
          background: linear-gradient(135deg, #D4A853, #C4983F);
          color: #0D2420;
        }
        .conv-info { flex: 1; min-width: 0; }
        .conv-phone { font-size: 13px; font-weight: 600; color: #F7E7CE; margin-bottom: 3px; }
        .conv-last {
          font-size: 12px; color: #8A7560;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .conv-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
        .conv-time { font-size: 11px; color: #8A7560; white-space: nowrap; }
        .chat-header {
          padding: 14px 16px;
          border-bottom: 1px solid #2A4A42;
          background: #0D2420;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .chat-back-btn {
          display: none;
          background: none;
          border: none;
          color: #C4A882;
          font-size: 18px;
          cursor: pointer;
          padding: 2px 6px;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .chat-back-btn:hover { color: #F7E7CE; }
        .chat-name { font-size: 14px; font-weight: 600; color: #F7E7CE; }
        .chat-status { font-size: 12px; color: #4CAF82; margin-top: 1px; }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #0D2420;
        }
        .msg-wrap {
          display: flex;
          flex-direction: column;
          max-width: 75%;
        }
        .msg-wrap.customer { align-self: flex-start; }
        .msg-wrap.bot { align-self: flex-end; align-items: flex-end; }
        .msg-sender { font-size: 11px; color: #8A7560; margin-bottom: 4px; }
        .msg-bubble {
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.55;
        }
        .msg-bubble.customer {
          background: #1A3D35;
          border: 1px solid #2A4A42;
          color: #C4A882;
          border-radius: 16px 16px 16px 4px;
        }
        .msg-bubble.bot {
          background: rgba(212,168,83,0.1);
          border: 1px solid rgba(212,168,83,0.2);
          color: #F7E7CE;
          border-radius: 16px 16px 4px 16px;
        }
        .msg-time { font-size: 11px; color: #8A7560; margin-top: 4px; }
        .typing-wrap {
          align-self: flex-end;
          background: rgba(212,168,83,0.08);
          border: 1px solid rgba(212,168,83,0.15);
          border-radius: 16px 16px 4px 16px;
          padding: 10px 14px;
          display: flex; gap: 5px; align-items: center;
        }
        .tdot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #D4A853; opacity: 0.7;
          animation: tbounce 1.2s ease infinite;
        }
        .tdot:nth-child(2) { animation-delay: 0.2s; }
        .tdot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes tbounce {
          0%,100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        .chat-input-bar {
          padding: 12px 14px;
          background: #0D2420;
          border-top: 1px solid #2A4A42;
          display: flex;
          gap: 10px;
          align-items: center;
          flex-shrink: 0;
        }
        .chat-input {
          flex: 1;
          min-width: 0;
          padding: 10px 14px;
          background: #102C26;
          border: 1px solid #2A4A42;
          border-radius: 10px;
          color: #F7E7CE;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border 0.2s;
        }
        .chat-input::placeholder { color: #8A7560; }
        .chat-input:focus { border-color: #D4A853; box-shadow: 0 0 0 3px rgba(212,168,83,0.1); }
        .send-btn {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #D4A853, #C4983F);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; color: #0D2420;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .send-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(212,168,83,0.3); }

        /* Empty state */
        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #8A7560;
          font-size: 14px;
        }
        .empty-icon { font-size: 40px; opacity: 0.5; }

        /* Loading skeleton */
        .skeleton {
          background: linear-gradient(90deg, #1A3D35 25%, #223D37 50%, #1A3D35 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
          height: 12px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 768px) {
          .conv-shell {
            height: calc(100vh - 120px);
            border-radius: 16px;
            position: relative;
          }
          .conv-list-panel {
            width: 100%;
            position: absolute;
            inset: 0;
            z-index: 2;
            border-right: none;
            border-radius: 16px;
            transition: transform 0.28s ease, opacity 0.28s ease;
          }
          .conv-list-panel.hide-mobile {
            transform: translateX(-100%);
            opacity: 0;
            pointer-events: none;
          }
          .conv-chat-panel {
            width: 100%;
            position: absolute;
            inset: 0;
            z-index: 1;
            border-radius: 16px;
            transform: translateX(100%);
            opacity: 0;
            transition: transform 0.28s ease, opacity 0.28s ease;
            pointer-events: none;
          }
          .conv-chat-panel.show-mobile {
            transform: translateX(0);
            opacity: 1;
            pointer-events: auto;
            z-index: 3;
          }
          .chat-back-btn { display: block; }
          .conv-avatar { width: 36px; height: 36px; font-size: 12px; }
          .msg-wrap { max-width: 88%; }
        }
        @media (max-width: 480px) {
          .conv-shell { height: calc(100vh - 110px); border-radius: 14px; }
          .list-header { padding: 12px; }
          .conv-item { padding: 12px; }
          .chat-messages { padding: 12px; gap: 12px; }
          .chat-input-bar { padding: 10px 12px; }
        }
      `}</style>

      <div className="conv-shell">

        {/* ── LEFT: Conversation List ── */}
        <div className={`conv-list-panel${showChat ? ' hide-mobile' : ''}`}>
          <div className="list-header">
            <div className="list-title">
              {loading ? 'Loading...' : `${conversations.length} Conversations`}
            </div>
            <div className="filter-row">
              {filters.map(f => (
                <button
                  key={f}
                  className={`filter-btn${activeFilter === f ? ' active' : ''}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="conv-items">
            {loading ? (
              // Skeleton loading
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="conv-item" style={{ opacity: 0.5 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1A3D35' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton" style={{ width: '60%' }} />
                    <div className="skeleton" style={{ width: '80%' }} />
                  </div>
                </div>
              ))
            ) : conversations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8A7560', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
                Koi conversation nahi abhi tak.
                <br />WhatsApp pe message bhejo!
              </div>
            ) : (
              conversations.map((conv, i) => (
                <div
                  key={conv.id}
                  className={`conv-item${selected === i ? ' active' : ''}`}
                  onClick={() => handleSelect(i)}
                >
                  <div className="conv-avatar">
                    {conv.customer_phone.slice(-2).toUpperCase()}
                  </div>
                  <div className="conv-info">
                    <div className="conv-phone">{conv.customer_phone}</div>
                    <div className="conv-last">{conv.lastMessage}</div>
                  </div>
                  <div className="conv-meta">
                    <div className="conv-time">{timeAgo(conv.updated_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: Chat Panel ── */}
        <div className={`conv-chat-panel${showChat ? ' show-mobile' : ''}`}>

          {!current ? (
            <div className="empty-state">
              <div className="empty-icon">👈</div>
              <div>Conversation select karo</div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <button className="chat-back-btn" onClick={() => setShowChat(false)}>←</button>
                <div className="conv-avatar gold">
                  {current.customer_phone.slice(-2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="chat-name">{current.customer_phone}</div>
                  <div className="chat-status">
                    ● {current.messages?.length || 0} messages
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {!current.messages || current.messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#8A7560', fontSize: 13, marginTop: 40 }}>
                    Koi messages nahi abhi tak
                  </div>
                ) : (
                  current.messages.map((msg) => (
                    <div key={msg.id} className={`msg-wrap ${msg.sender}`}>
                      <div className="msg-sender">
                        {msg.sender === 'customer' ? '👤 Customer' : '🤖 Munshi'}
                      </div>
                      <div className={`msg-bubble ${msg.sender}`}>{msg.content}</div>
                      <div className="msg-time">{timeAgo(msg.timestamp)}</div>
                    </div>
                  ))
                )}

                {isTyping && (
                  <div className="typing-wrap">
                    <div className="tdot" /><div className="tdot" /><div className="tdot" />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="chat-input-bar">
                <input
                  className="chat-input"
                  type="text"
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                />
                <button className="send-btn" onClick={handleSend}>➤</button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}