import React from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'

export default function AnalyticsPage() {
  // Sample data for charts
  const messageData = [
    { day: 'Mon', messages: 145 },
    { day: 'Tue', messages: 189 },
    { day: 'Wed', messages: 167 },
    { day: 'Thu', messages: 203 },
    { day: 'Fri', messages: 178 },
    { day: 'Sat', messages: 134 },
    { day: 'Sun', messages: 156 },
  ]

  const topQuestions = [
    { question: 'What are your delivery charges?', count: 45, percentage: 78 },
    { question: 'Do you offer cash on delivery?', count: 38, percentage: 66 },
    { question: 'How can I track my order?', count: 32, percentage: 55 },
    { question: 'What is your return policy?', count: 28, percentage: 48 },
    { question: 'Do you ship internationally?', count: 22, percentage: 38 },
  ]

  const maxMessages = Math.max(...messageData.map(d => d.messages))
  const maxQuestionCount = Math.max(...topQuestions.map(q => q.count))

  return (
    <DashboardLayout 
      title="Analytics" 
      subtitle="Track your bot performance and customer interactions"
    >
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center text-lg">
              📈
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-[#F7E7CE] mb-1">1,247</div>
          <div className="text-xs text-[#8A7560]">Total Messages</div>
          <div className="text-xs text-[#4CAF82] mt-2">↑ 12% from last week</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center text-lg">
              💬
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-[#F7E7CE] mb-1">89</div>
          <div className="text-xs text-[#8A7560]">Conversations</div>
          <div className="text-xs text-[#4CAF82] mt-2">↑ 5 from yesterday</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center text-lg">
              ⚡
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-[#F7E7CE] mb-1">2.3s</div>
          <div className="text-xs text-[#8A7560]">Avg Response Time</div>
          <div className="text-xs text-[#4CAF82] mt-2">↓ 0.5s improvement</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center text-lg">
              😊
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-[#F7E7CE] mb-1">94%</div>
          <div className="text-xs text-[#8A7560]">Satisfaction Rate</div>
          <div className="text-xs text-[#4CAF82] mt-2">↑ 3% from last month</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-7">
        {/* Messages Chart */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-2">Messages per Day</h3>
          <p className="text-xs text-[#8A7560] mb-6">Last 7 days overview</p>
          
          <div className="h-56 relative">
            {/* SVG Line Chart */}
            <svg width="100%" height="100%" viewBox="0 0 400 200" className="w-full h-full">
              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="40"
                  y1={y * 2 - 10}
                  x2="380"
                  y2={y * 2 - 10}
                  stroke="#2A4A42"
                  strokeWidth="1"
                  opacity="0.3"
                />
              ))}
              
              {/* Y-axis labels */}
              {[0, 50, 100, 150, 200].map((val, i) => (
                <text
                  key={i}
                  x="30"
                  y={i * 50 + 5}
                  fill="#8A7560"
                  fontSize="10"
                  textAnchor="end"
                >
                  {val}
                </text>
              ))}
              
              {/* Data points and line */}
              {messageData.map((point, index) => {
                const x = 60 + (index * 50)
                const y = 190 - (point.messages / maxMessages * 180)
                
                return (
                  <g key={index}>
                    {/* Line */}
                    {index > 0 && (
                      <line
                        x1={60 + ((index - 1) * 50)}
                        y1={190 - (messageData[index - 1].messages / maxMessages * 180)}
                        x2={x}
                        y2={y}
                        stroke="url(#lineGradient)"
                        strokeWidth="2"
                      />
                    )}
                    {/* Point */}
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#D4A853"
                      stroke="#0D2420"
                      strokeWidth="2"
                    />
                    {/* X-axis label */}
                    <text
                      x={x}
                      y="195"
                      fill="#8A7560"
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {point.day}
                    </text>
                  </g>
                )
              })}
              
              {/* Gradient definition */}
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D4A853" />
                  <stop offset="100%" stopColor="#F0C96A" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Top Questions */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-2">Top Questions</h3>
          <p className="text-xs text-[#8A7560] mb-6">Most frequently asked questions</p>
          
          <div className="space-y-4">
            {topQuestions.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-[#F7E7CE] flex-1 pr-3">
                    {item.question}
                  </div>
                  <div className="text-xs text-[#D4A853] font-medium">
                    {item.count}
                  </div>
                </div>
                <div className="relative">
                  <div className="h-2 bg-[#2A4A42] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#D4A853] to-[#F0C96A] rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-[#8A7560] mt-1">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bot vs Human Donut Chart */}
      <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.2)] transition-all">
        <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-2">Response Distribution</h3>
        <p className="text-xs text-[#8A7560] mb-6">Bot vs Human response breakdown</p>
        
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* SVG Donut Chart */}
            <svg width="200" height="200" viewBox="0 0 200 200" className="w-48 h-48">
              {/* Bot segment (94%) */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="url(#botGradient)"
                strokeWidth="30"
                strokeDasharray={`${94 * 5.02} ${100 * 5.02}`}
                transform="rotate(-90 100 100)"
              />
              
              {/* Human segment (6%) */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#2A4A42"
                strokeWidth="30"
                strokeDasharray={`${6 * 5.02} ${100 * 5.02}`}
                strokeDashoffset={`-${94 * 5.02}`}
                transform="rotate(-90 100 100)"
              />
              
              {/* Center text */}
              <text
                x="100"
                y="95"
                fill="#F7E7CE"
                fontSize="32"
                fontWeight="bold"
                textAnchor="middle"
                className="font-serif"
              >
                94%
              </text>
              <text
                x="100"
                y="115"
                fill="#8A7560"
                fontSize="12"
                textAnchor="middle"
              >
                Bot Responses
              </text>
              
              {/* Gradients */}
              <defs>
                <linearGradient id="botGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D4A853" />
                  <stop offset="100%" stopColor="#F0C96A" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Legend */}
          <div className="ml-12 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#D4A853] to-[#F0C96A]"></div>
              <div>
                <div className="text-sm text-[#F7E7CE] font-medium">Bot Responses</div>
                <div className="text-xs text-[#8A7560]">1,172 messages (94%)</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-[#2A4A42]"></div>
              <div>
                <div className="text-sm text-[#F7E7CE] font-medium">Human Responses</div>
                <div className="text-xs text-[#8A7560]">75 messages (6%)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
