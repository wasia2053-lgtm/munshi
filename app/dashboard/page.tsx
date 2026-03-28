'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Good morning! Here's your bot activity.">
        <div className="text-[#F7E7CE]">Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard" subtitle="Good morning! Here's your bot activity.">
      {/* STATS GRID - MOBILE FIRST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-5">
        {/* Stat Card 1 */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl sm:text-2xl">📱</span>
            <span className="text-xs text-[#8A7560]">Connected</span>
          </div>
          <div className="text-[#F7E7CE] font-semibold text-sm sm:text-base">+92 301 1234567</div>
          <div className="text-xs text-[#8A7560] mt-1">Since May 1, 2025</div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl sm:text-2xl">🛡️</span>
            <span className="text-xs text-[#8A7560]">Bot Status</span>
          </div>
          <div className="text-[#F7E7CE] font-semibold text-sm sm:text-base">Active</div>
          <div className="text-xs text-[#8A7560] mt-1">Running 24/7</div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl sm:text-2xl">💬</span>
            <span className="text-xs text-[#8A7560]">Messages</span>
          </div>
          <div className="text-[#F7E7CE] font-semibold text-sm sm:text-base">347 / 500</div>
          <div className="text-xs text-[#8A7560] mt-1">69% used</div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl sm:text-2xl">📊</span>
            <span className="text-xs text-[#8A7560]">Accuracy</span>
          </div>
          <div className="text-[#F7E7CE] font-semibold text-sm sm:text-base">94%</div>
          <div className="text-xs text-[#8A7560] mt-1">+3% vs last week</div>
        </div>
      </div>

      {/* MAIN GRID - 1 COLUMN MOBILE, 2 DESKTOP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5 hover:border-[rgba(212,168,83,0.2)] transition-all">
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#F7E7CE] mb-2 sm:mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <button className="w-full px-3 py-2 sm:py-2.5 text-left flex items-center gap-2 sm:gap-3 border border-[rgba(212,168,83,0.3)] text-[#D4A853] rounded-lg hover:bg-[rgba(212,168,83,0.08)] transition-all text-xs sm:text-sm">
                🧠 <span>Train My Bot</span>
              </button>
              <button className="w-full px-3 py-2 sm:py-2.5 text-left flex items-center gap-2 sm:gap-3 border border-[rgba(196,168,130,0.3)] text-[#C4A882] rounded-lg hover:bg-[rgba(247,231,206,0.04)] transition-all text-xs sm:text-sm">
                💬 <span>View Conversations</span>
              </button>
            </div>
          </div>

          {/* Upgrade Card */}
          <div className="bg-gradient-to-r from-[#D4A853] to-[#E8C869] rounded-lg p-3 sm:p-4 lg:p-5 text-center cursor-pointer hover:shadow-lg transition-all">
            <div className="text-2xl mb-2">🚀</div>
            <h3 className="font-serif font-bold text-[#0D2420] text-sm sm:text-base mb-1">Upgrade to Growth</h3>
            <p className="text-xs text-[rgba(13,36,32,0.8)]">Unlock unlimited messages</p>
          </div>

          {/* Plan Usage Card */}
          <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5 hover:border-[rgba(212,168,83,0.2)] transition-all">
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#F7E7CE] mb-2">Plan Usage</h3>
            <div className="bg-[#0D2420] rounded-lg p-2.5 sm:p-3 mb-2">
              <span className="text-xs font-semibold text-[#D4A853]">Free Plan</span>
              <div className="text-xs text-[#8A7560] mt-1">Messages this month</div>
              <div className="text-[#F7E7CE] font-bold text-xs sm:text-sm mt-1">347 / 500</div>
              <div className="h-1 bg-[#2A4A42] rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#D4A853] to-[#F0C96A]" style={{ width: '69%' }}></div>
              </div>
            </div>
            <p className="text-xs text-[#8A7560]">153 messages left. <span className="text-[#D4A853]">Upgrade for 5,000 msgs</span></p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
          {/* Recent Conversations */}
          <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5 hover:border-[rgba(212,168,83,0.2)] transition-all overflow-hidden">
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#F7E7CE]">Recent Conversations</h3>
              <a href="#" className="text-xs text-[#D4A853] hover:text-[#F0C96A]">View All →</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#2A4A42]">
                    <th className="text-left py-2 px-2 text-[#8A7560] font-semibold whitespace-nowrap">Customer</th>
                    <th className="text-left py-2 px-2 text-[#8A7560] font-semibold whitespace-nowrap">Message</th>
                    <th className="text-left py-2 px-2 text-[#8A7560] font-semibold whitespace-nowrap">Time</th>
                    <th className="text-left py-2 px-2 text-[#8A7560] font-semibold whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#2A4A42]/50 hover:bg-[rgba(212,168,83,0.04)]">
                    <td className="py-2 px-2 text-[#F7E7CE] whitespace-nowrap">+92 301 1234567</td>
                    <td className="py-2 px-2 text-[#C4A882] whitespace-nowrap">Delivery kab hogi?</td>
                    <td className="py-2 px-2 text-[#8A7560] whitespace-nowrap">2 min ago</td>
                    <td className="py-2 px-2"><span className="text-green-400">●</span></td>
                  </tr>
                  <tr className="border-b border-[#2A4A42]/50 hover:bg-[rgba(212,168,83,0.04)]">
                    <td className="py-2 px-2 text-[#F7E7CE] whitespace-nowrap">+92 333 9876543</td>
                    <td className="py-2 px-2 text-[#C4A882] whitespace-nowrap">COD available har?</td>
                    <td className="py-2 px-2 text-[#8A7560] whitespace-nowrap">15 min ago</td>
                    <td className="py-2 px-2"><span className="text-green-400">●</span></td>
                  </tr>
                  <tr className="border-b border-[#2A4A42]/50 hover:bg-[rgba(212,168,83,0.04)]">
                    <td className="py-2 px-2 text-[#F7E7CE] whitespace-nowrap">+92 321 5555111</td>
                    <td className="py-2 px-2 text-[#C4A882] whitespace-nowrap">Exchange policy kya h</td>
                    <td className="py-2 px-2 text-[#8A7560] whitespace-nowrap">1 hr ago</td>
                    <td className="py-2 px-2"><span className="text-red-400">●</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Chat Test */}
          <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-lg p-3 sm:p-4 lg:p-5 hover:border-[rgba(212,168,83,0.2)] transition-all">
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#F7E7CE] mb-2.5">Test AI Chat</h3>
            <div className="space-y-2">
              <div className="text-xs text-[#8A7560] mb-2">Test Message</div>
              <input
                type="text"
                placeholder="Type a message to test the AI..."
                className="w-full bg-[#0D2420] border border-[#2A4A42] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#F7E7CE] placeholder-[#8A7560] focus:border-[rgba(212,168,83,0.5)] focus:outline-none transition-all"
              />
              <button className="w-full bg-gradient-to-r from-[#D4A853] to-[#E8C869] text-[#0D2420] font-semibold py-2.5 sm:py-3 rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm">
                Test AI
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}