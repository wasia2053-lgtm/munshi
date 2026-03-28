'use client'
export const dynamic = 'force-dynamic';

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'

const conversations = [
  {
    id: 1, phone: '+92 301 1234567', lastMessage: 'Delivery kab hogi?',
    time: '2 min ago', unread: true,
    messages: [
      { id: 1, sender: 'customer', text: 'Hello, I want to check my order status', time: '10:30 AM' },
      { id: 2, sender: 'bot', text: "Hello! I'd be happy to help you check your order status. Could you please provide your order number?", time: '10:30 AM' },
      { id: 3, sender: 'customer', text: 'Order #12345', time: '10:31 AM' },
      { id: 4, sender: 'bot', text: 'Your order #12345 is currently being processed and will be delivered within 2-3 business days.', time: '10:31 AM' },
      { id: 5, sender: 'customer', text: 'Delivery kab hogi?', time: '10:32 AM' },
    ]
  },
  {
    id: 2, phone: '+92 333 9876543', lastMessage: 'COD available hai?',
    time: '15 min ago', unread: true,
    messages: [
      { id: 1, sender: 'customer', text: 'Hi, do you offer cash on delivery?', time: '10:15 AM' },
      { id: 2, sender: 'bot', text: "Yes, we offer COD for all orders within Pakistan. There's no additional charge.", time: '10:15 AM' },
      { id: 3, sender: 'customer', text: 'COD available hai?', time: '10:16 AM' },
    ]
  },
  {
    id: 3, phone: '+92 321 5555111', lastMessage: 'Exchange policy kya h',
    time: '1 hr ago', unread: false,
    messages: [
      { id: 1, sender: 'customer', text: 'What is your exchange policy?', time: '9:30 AM' },
      { id: 2, sender: 'bot', text: 'We offer a 7-day exchange policy. Items must be unused with original tags.', time: '9:30 AM' },
      { id: 3, sender: 'customer', text: 'Exchange policy kya h', time: '9:31 AM' },
    ]
  },
  {
    id: 4, phone: '+92 311 2223334', lastMessage: 'Price kya hai shirt ka',
    time: '2 hr ago', unread: false,
    messages: [
      { id: 1, sender: 'customer', text: 'Price kya hai shirt ka', time: '8:30 AM' },
      { id: 2, sender: 'bot', text: 'Our shirts range from PKR 1,500 to PKR 3,500 depending on the design and fabric.', time: '8:30 AM' },
    ]
  },
  {
    id: 5, phone: '+92 345 6667778', lastMessage: 'Order cancel karna h',
    time: '3 hr ago', unread: false,
    messages: [
      { id: 1, sender: 'customer', text: 'I need to cancel my order', time: '7:30 AM' },
      { id: 2, sender: 'bot', text: 'I can help you cancel your order. Please provide your order number and reason.', time: '7:30 AM' },
      { id: 3, sender: 'customer', text: 'Order #67890 - Changed my mind', time: '7:31 AM' },
      { id: 4, sender: 'bot', text: 'Your order #67890 has been successfully cancelled. Refund within 3-5 business days.', time: '7:31 AM' },
    ]
  },
]

const filters = ['All', 'Unread', 'Bot Active', 'Human']

export default function ConversationsPage() {
  const [selected, setSelected]         = useState(0)
  const [activeFilter, setActiveFilter] = useState('All')
  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping]         = useState(false)
  const [showChat, setShowChat]         = useState(false) // mobile toggle

  const current = conversations[selected]

  const handleSelect = (index: number) => {
    setSelected(index)
    setShowChat(true) // on mobile, switch to chat view
  }

  const handleSend = () => {
    if (!messageInput.trim()) return
    setIsTyping(true)
    setTimeout(() => { setIsTyping(false); setMessageInput('') }, 2000)
  }

  return (
    <DashboardLayout
      title="Conversations"
      subtitle="Monitor and respond to customer conversations"
    >
      <style>{`
        /* ── SHELL ── */
        .conv-shell {
          display: flex;
          height: calc(100vh - 130px);
          min-height: 500px;
          border: 1px solid #2A4A42;
          border-radius: 20px;
          overflow: hidden;
          background: #102C26;
        }

        /* ── LEFT PANEL ── */
        .conv-list-panel {
          width: 300px;
          flex-shrink: 0;
          background: #0D2420;
          border-right: 1px solid #2A4A42;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* ── RIGHT PANEL ── */
        .conv-chat-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        /* ── LIST HEADER ── */
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
          -webkit-overflow-scrolling: touch;
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

        /* ── CONV ITEMS ── */
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
        .conv-dot { width: 8px; height: 8px; border-radius: 50%; background: #D4A853; }

        /* ── CHAT HEADER ── */
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

        /* ── MESSAGES ── */
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

        /* typing dots */
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

        /* ── CHAT INPUT ── */
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

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .conv-shell {
            height: calc(100vh - 120px);
            border-radius: 16px;
            position: relative;
          }

          /* List panel: full width on mobile */
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

          /* Chat panel: full width on mobile */
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

          /* Show back button on mobile */
          .chat-back-btn { display: block; }

          /* Smaller avatar */
          .conv-avatar { width: 36px; height: 36px; font-size: 12px; }

          /* Msg max width wider on small screens */
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
            <div className="list-title">All Conversations</div>
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
            {conversations.map((conv, i) => (
              <div
                key={conv.id}
                className={`conv-item${selected === i ? ' active' : ''}`}
                onClick={() => handleSelect(i)}
              >
                <div className="conv-avatar">{conv.phone.slice(-2)}</div>
                <div className="conv-info">
                  <div className="conv-phone">{conv.phone}</div>
                  <div className="conv-last">{conv.lastMessage}</div>
                </div>
                <div className="conv-meta">
                  <div className="conv-time">{conv.time}</div>
                  {conv.unread && <div className="conv-dot" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Chat Panel ── */}
        <div className={`conv-chat-panel${showChat ? ' show-mobile' : ''}`}>

          {/* Chat Header */}
          <div className="chat-header">
            <button className="chat-back-btn" onClick={() => setShowChat(false)}>← </button>
            <div className="conv-avatar gold">{current.phone.slice(-2)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="chat-name">{current.phone}</div>
              <div className="chat-status">● Active now</div>
            </div>
            <button style={{ background: 'none', border: 'none', color: '#8A7560', fontSize: 20, cursor: 'pointer' }}>⋯</button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {current.messages.map(msg => (
              <div key={msg.id} className={`msg-wrap ${msg.sender}`}>
                <div className="msg-sender">
                  {msg.sender === 'customer' ? '👤 Customer' : '🤖 Bot'}
                </div>
                <div className={`msg-bubble ${msg.sender}`}>{msg.text}</div>
                <div className="msg-time">{msg.time}</div>
              </div>
            ))}

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
        </div>

      </div>
    </DashboardLayout>
  )
}