
'use client'
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import React, { useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'

export default function ConversationsPage() {
  const [selectedConversation, setSelectedConversation] = useState(0)
  const [activeFilter, setActiveFilter] = useState('all')
  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const conversations = [
    {
      id: 1,
      phone: '+92 301 1234567',
      lastMessage: 'Delivery kab hogi?',
      time: '2 min ago',
      unread: true,
      messages: [
        { id: 1, sender: 'customer', text: 'Hello, I want to check my order status', time: '10:30 AM' },
        { id: 2, sender: 'bot', text: 'Hello! I\'d be happy to help you check your order status. Could you please provide your order number?', time: '10:30 AM' },
        { id: 3, sender: 'customer', text: 'Order #12345', time: '10:31 AM' },
        { id: 4, sender: 'bot', text: 'Thank you! Your order #12345 is currently being processed and will be delivered within 2-3 business days. You can track it here: tracking.example.com/12345', time: '10:31 AM' },
        { id: 5, sender: 'customer', text: 'Delivery kab hogi?', time: '10:32 AM' },
      ]
    },
    {
      id: 2,
      phone: '+92 333 9876543',
      lastMessage: 'COD available hai?',
      time: '15 min ago',
      unread: true,
      messages: [
        { id: 1, sender: 'customer', text: 'Hi, do you offer cash on delivery?', time: '10:15 AM' },
        { id: 2, sender: 'bot', text: 'Yes, we offer cash on delivery (COD) for all orders within Pakistan. There\'s no additional charge for COD payments.', time: '10:15 AM' },
        { id: 3, sender: 'customer', text: 'COD available hai?', time: '10:16 AM' },
      ]
    },
    {
      id: 3,
      phone: '+92 321 5555111',
      lastMessage: 'Exchange policy kya h',
      time: '1 hr ago',
      unread: false,
      messages: [
        { id: 1, sender: 'customer', text: 'What is your exchange policy?', time: '9:30 AM' },
        { id: 2, sender: 'bot', text: 'We offer a 7-day exchange policy. Items must be unused with original tags. Please visit our returns page for more details.', time: '9:30 AM' },
        { id: 3, sender: 'customer', text: 'Exchange policy kya h', time: '9:31 AM' },
      ]
    },
    {
      id: 4,
      phone: '+92 311 2223334',
      lastMessage: 'Price kya hai shirt ka',
      time: '2 hr ago',
      unread: false,
      messages: [
        { id: 1, sender: 'customer', text: 'Price kya hai shirt ka', time: '8:30 AM' },
        { id: 2, sender: 'bot', text: 'Our shirts range from PKR 1,500 to PKR 3,500 depending on the design and fabric. Which specific shirt are you interested in?', time: '8:30 AM' },
      ]
    },
    {
      id: 5,
      phone: '+92 345 6667778',
      lastMessage: 'Order cancel karna h',
      time: '3 hr ago',
      unread: false,
      messages: [
        { id: 1, sender: 'customer', text: 'I need to cancel my order', time: '7:30 AM' },
        { id: 2, sender: 'bot', text: 'I can help you cancel your order. Please provide your order number and reason for cancellation.', time: '7:30 AM' },
        { id: 3, sender: 'customer', text: 'Order #67890 - Changed my mind', time: '7:31 AM' },
        { id: 4, sender: 'bot', text: 'Your order #67890 has been successfully cancelled. You will receive a full refund within 3-5 business days.', time: '7:31 AM' },
      ]
    },
  ]

  const currentConversation = conversations[selectedConversation]

  const handleSendMessage = () => {
    if (!messageInput.trim()) return
    
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessageInput('')
    }, 2000)
  }

  return (
    <DashboardLayout 
      title="Conversations" 
      subtitle="Monitor and respond to customer conversations"
    >
      <div className="flex gap-0 h-[calc(100vh-8rem)] min-h-[480px]">
        {/* Conversation List */}
        <div className="w-[300px] flex-shrink-0 bg-[#0D2420] border border-[#2A4A42] rounded-l-2xl flex flex-col overflow-hidden">
          {/* List Header */}
          <div className="p-4 border-b border-[#2A4A42]">
            <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-3">All Conversations</h3>
            
            {/* Filter Tabs */}
            <div className="flex gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all whitespace-nowrap border border-transparent ${
                  activeFilter === 'all'
                    ? 'bg-[rgba(212,168,83,0.1)] text-[#D4A853] border-[rgba(212,168,83,0.2)]'
                    : 'text-[#8A7560] hover:text-[#F7E7CE]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all whitespace-nowrap border border-transparent ${
                  activeFilter === 'unread'
                    ? 'bg-[rgba(212,168,83,0.1)] text-[#D4A853] border-[rgba(212,168,83,0.2)]'
                    : 'text-[#8A7560] hover:text-[#F7E7CE]'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setActiveFilter('bot')}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all whitespace-nowrap border border-transparent ${
                  activeFilter === 'bot'
                    ? 'bg-[rgba(212,168,83,0.1)] text-[#D4A853] border-[rgba(212,168,83,0.2)]'
                    : 'text-[#8A7560] hover:text-[#F7E7CE]'
                }`}
              >
                Bot Active
              </button>
              <button
                onClick={() => setActiveFilter('human')}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all whitespace-nowrap border border-transparent ${
                  activeFilter === 'human'
                    ? 'bg-[rgba(212,168,83,0.1)] text-[#D4A853] border-[rgba(212,168,83,0.2)]'
                    : 'text-[#8A7560] hover:text-[#F7E7CE]'
                }`}
              >
                Human
              </button>
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv, index) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(index)}
                className={`p-4 border-b border-[rgba(42,74,66,0.4)] cursor-pointer transition-all flex gap-3 items-start ${
                  selectedConversation === index
                    ? 'bg-[rgba(212,168,83,0.06)] border-l-3 border-l-[#D4A853]'
                    : 'hover:bg-[rgba(247,231,206,0.02)]'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2A4A42] to-[#1A3D35] flex items-center justify-center text-sm font-bold text-[#C4A882] flex-shrink-0 font-serif">
                  {conv.phone.slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#F7E7CE] mb-1">{conv.phone}</div>
                  <div className="text-xs text-[#8A7560] whitespace-nowrap overflow-hidden text-ellipsis">
                    {conv.lastMessage}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="text-xs text-[#8A7560]">{conv.time}</div>
                  {conv.unread && (
                    <div className="w-2 h-2 rounded-full bg-[#D4A853]"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 border border-[#2A4A42] border-l-0 rounded-r-2xl flex flex-col overflow-hidden bg-[#102C26]">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#2A4A42] bg-[#0D2420] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A853] to-[#C4983F] flex items-center justify-center text-base font-bold text-[#0D2420] font-serif">
              {currentConversation.phone.slice(-2)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#F7E7CE]">{currentConversation.phone}</div>
              <div className="text-xs text-[#8A7560] mt-0.5">Active now</div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-[#8A7560] hover:text-[#F7E7CE] transition-colors">
                ⋯
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[#0D2420]">
            {currentConversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col max-w-[70%] ${
                  message.sender === 'customer' 
                    ? 'self-start' 
                    : 'self-end items-end'
                }`}
              >
                <div className="text-xs text-[#8A7560] mb-1 flex items-center gap-1">
                  {message.sender === 'customer' ? 'Customer' : 'Bot'}
                </div>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  message.sender === 'customer'
                    ? 'bg-[#1A3D35] border border-[#2A4A42] text-[#C4A882] rounded-2xl rounded-tl-sm'
                    : 'bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] text-[#F7E7CE] rounded-2xl rounded-tr-sm'
                }`}>
                  {message.text}
                </div>
                <div className="text-xs text-[#8A7560] mt-1">{message.time}</div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="self-end bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.15)] rounded-2xl rounded-tr-sm px-4 py-3 flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A853] opacity-70 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A853] opacity-70 animate-bounce" style={{ animationDelay: '200ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A853] opacity-70 animate-bounce" style={{ animationDelay: '400ms' }}></div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-[#0D2420] border-t border-[#2A4A42]">
            <div className="flex gap-2.5 items-center">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-[#102C26] border border-[#2A4A42] rounded-lg text-[#F7E7CE] placeholder-[#8A7560] focus:outline-none focus:border-[#D4A853] focus:ring-2 focus:ring-[rgba(212,168,83,0.1)] transition-all text-sm"
              />
              <button
                onClick={handleSendMessage}
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4A853] to-[#C4983F] border-none cursor-pointer flex items-center justify-center text-base transition-all hover:transform hover:translateY-[-1px] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)] text-[#0D2420]"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
