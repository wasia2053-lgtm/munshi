import React from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Good morning! Here's your bot activity."
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
        {/* Messages Stat */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.25)] hover:transform hover:translateY-[-3px] hover:shadow-xl hover:shadow-[rgba(0,0,0,0.3)] transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center text-xl">
              💬
            </div>
          </div>
          <div className="font-serif text-4xl font-bold text-[#F7E7CE] mb-1">1,247</div>
          <div className="text-xs text-[#8A7560] mb-2">Total Messages</div>
          <div className="text-xs flex items-center gap-1 text-[#4CAF82]">
            ↑ +12% this week
          </div>
        </div>

        {/* Conversations Stat */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.25)] hover:transform hover:translateY-[-3px] hover:shadow-xl hover:shadow-[rgba(0,0,0,0.3)] transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center text-xl">
              👥
            </div>
          </div>
          <div className="font-serif text-4xl font-bold text-[#F7E7CE] mb-1">89</div>
          <div className="text-xs text-[#8A7560] mb-2">Conversations</div>
          <div className="text-xs flex items-center gap-1 text-[#4CAF82]">
            ↑ +5 today
          </div>
        </div>

        {/* WhatsApp Status */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.25)] hover:transform hover:translateY-[-3px] hover:shadow-xl hover:shadow-[rgba(0,0,0,0.3)] transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center text-xl">
              📱
            </div>
          </div>
          <div className="mb-1">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-[rgba(76,175,130,0.12)] text-[#4CAF82] border border-[rgba(76,175,130,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF82] animate-pulse"></span>
              Connected
            </span>
          </div>
          <div className="text-xs text-[#8A7560] mb-2 mt-2">+92 301 1234567</div>
          <div className="text-xs text-[#8A7560]">Since May 1, 2025</div>
        </div>

        {/* Bot Accuracy */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.25)] hover:transform hover:translateY-[-3px] hover:shadow-xl hover:shadow-[rgba(0,0,0,0.3)] transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center text-xl">
              🤖
            </div>
          </div>
          <div className="font-serif text-4xl font-bold text-[#F7E7CE] mb-1">94%</div>
          <div className="text-xs text-[#8A7560] mb-2">Bot Accuracy</div>
          <div className="text-xs flex items-center gap-1 text-[#4CAF82]">
            ↑ +3% vs last week
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Conversations */}
        <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.2)] transition-all">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#F7E7CE]">Recent Conversations</h3>
              <p className="text-xs text-[#8A7560]">Last 5 customer chats</p>
            </div>
            <Link href="/dashboard/conversations">
              <button className="px-4 py-2 text-sm font-medium border border-[rgba(212,168,83,0.3)] text-[#D4A853] rounded-lg hover:bg-[rgba(212,168,83,0.08)] hover:border-[#D4A853] transition-all">
                View All →
              </button>
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A4A42]">
                  <th className="text-left p-3 text-xs font-semibold tracking-wider uppercase text-[#8A7560]">Customer</th>
                  <th className="text-left p-3 text-xs font-semibold tracking-wider uppercase text-[#8A7560]">Last Message</th>
                  <th className="text-left p-3 text-xs font-semibold tracking-wider uppercase text-[#8A7560]">Time</th>
                  <th className="text-left p-3 text-xs font-semibold tracking-wider uppercase text-[#8A7560]">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[rgba(42,74,66,0.4)] hover:bg-[rgba(247,231,206,0.03)] transition-colors">
                  <td className="p-3 text-sm text-[#C4A882]">
                    <span className="text-[#F7E7CE] font-medium">+92 301 1234567</span>
                  </td>
                  <td className="p-3 text-sm text-[#C4A882]">Delivery kab hogi?</td>
                  <td className="p-3 text-xs text-[#8A7560]">2 min ago</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[rgba(76,175,130,0.12)] text-[#4CAF82] border border-[rgba(76,175,130,0.25)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF82] animate-pulse"></span>
                      Bot Active
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-[rgba(42,74,66,0.4)] hover:bg-[rgba(247,231,206,0.03)] transition-colors">
                  <td className="p-3 text-sm text-[#C4A882]">
                    <span className="text-[#F7E7CE] font-medium">+92 333 9876543</span>
                  </td>
                  <td className="p-3 text-sm text-[#C4A882]">COD available hai?</td>
                  <td className="p-3 text-xs text-[#8A7560]">15 min ago</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[rgba(76,175,130,0.12)] text-[#4CAF82] border border-[rgba(76,175,130,0.25)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF82] animate-pulse"></span>
                      Bot Active
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-[rgba(42,74,66,0.4)] hover:bg-[rgba(247,231,206,0.03)] transition-colors">
                  <td className="p-3 text-sm text-[#C4A882]">
                    <span className="text-[#F7E7CE] font-medium">+92 321 5555111</span>
                  </td>
                  <td className="p-3 text-sm text-[#C4A882]">Exchange policy kya h</td>
                  <td className="p-3 text-xs text-[#8A7560]">1 hr ago</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[rgba(212,168,83,0.12)] text-[#D4A853] border border-[rgba(212,168,83,0.25)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4A853] animate-pulse"></span>
                      Review
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-[rgba(42,74,66,0.4)] hover:bg-[rgba(247,231,206,0.03)] transition-colors">
                  <td className="p-3 text-sm text-[#C4A882]">
                    <span className="text-[#F7E7CE] font-medium">+92 311 2223334</span>
                  </td>
                  <td className="p-3 text-sm text-[#C4A882]">Price kya hai shirt ka</td>
                  <td className="p-3 text-xs text-[#8A7560]">2 hr ago</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[rgba(76,175,130,0.12)] text-[#4CAF82] border border-[rgba(76,175,130,0.25)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF82] animate-pulse"></span>
                      Bot Active
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[rgba(247,231,206,0.03)] transition-colors">
                  <td className="p-3 text-sm text-[#C4A882]">
                    <span className="text-[#F7E7CE] font-medium">+92 345 6667778</span>
                  </td>
                  <td className="p-3 text-sm text-[#C4A882]">Order cancel karna h</td>
                  <td className="p-3 text-xs text-[#8A7560]">3 hr ago</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[rgba(196,168,130,0.08)] text-[#C4A882] border border-[rgba(196,168,130,0.15)]">
                      Resolved
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-5">
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.2)] transition-all">
            <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/training">
                <button className="w-full px-4 py-3 text-left flex items-center gap-3 border border-[rgba(212,168,83,0.3)] text-[#D4A853] rounded-lg hover:bg-[rgba(212,168,83,0.08)] hover:border-[#D4A853] transition-all">
                  🧠 <span>Train My Bot</span>
                </button>
              </Link>
              <Link href="/dashboard/conversations">
                <button className="w-full px-4 py-3 text-left flex items-center gap-3 border border-[rgba(196,168,130,0.3)] text-[#C4A882] rounded-lg hover:bg-[rgba(247,231,206,0.04)] hover:border-[#C4A882] hover:text-[#F7E7CE] transition-all">
                  💬 <span>View Conversations</span>
                </button>
              </Link>
              <button className="w-full px-4 py-3 text-left flex items-center gap-3 bg-gradient-to-r from-[#D4A853] to-[#C4983F] text-[#0D2420] font-semibold rounded-lg hover:transform hover:translateY-[-2px] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)] transition-all">
                ✨ <span>Upgrade to Growth</span>
              </button>
            </div>
          </div>

          {/* Plan Usage */}
          <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6 hover:border-[rgba(212,168,83,0.2)] transition-all">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-serif text-lg font-bold text-[#F7E7CE]">Plan Usage</h3>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[rgba(196,168,130,0.08)] text-[#C4A882] border border-[rgba(196,168,130,0.15)]">
                Free Plan
              </span>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-sm text-[#C4A882] mb-2">
                <span>Messages this month</span>
                <span className="text-[#D4A853]">347 / 500</span>
              </div>
              <div className="h-2 bg-[#2A4A42] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#D4A853] to-[#F0C96A] rounded-full" style={{ width: '69%' }}></div>
              </div>
            </div>
            <p className="text-xs text-[#8A7560]">
              153 messages left. <span className="text-[#D4A853] hover:text-[#F0C96A] cursor-pointer transition-colors">Upgrade for 5,000 msgs →</span>
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
