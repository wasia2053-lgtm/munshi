
'use client'
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import React, { useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'

export default function WhatsAppPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [autoReply, setAutoReply] = useState(true)
  const [officeHours, setOfficeHours] = useState(false)

  return (
    <DashboardLayout 
      title="WhatsApp Integration" 
      subtitle="Connect your WhatsApp number to enable automated responses"
    >
      {/* Status Banner */}
      <div className={`p-4 rounded-xl flex items-center gap-3 mb-6 text-sm ${
        isConnected 
          ? 'bg-[rgba(76,175,130,0.1)] border border-[rgba(76,175,130,0.25)] text-[#4CAF82]' 
          : 'bg-[rgba(240,160,48,0.08)] border border-[rgba(240,160,48,0.25)] text-[#F0A030]'
      }`}>
        <span className="text-2xl">{isConnected ? '✅' : '⚠️'}</span>
        <span>
          {isConnected 
            ? 'Your WhatsApp is successfully connected and active' 
            : 'Connect your WhatsApp number to start automating customer responses'
          }
        </span>
      </div>

      {!isConnected ? (
        /* Disconnected State */
        <div className="max-w-xl mx-auto">
          <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-8 text-center">
            {/* QR Code Box */}
            <div className="w-56 h-56 mx-auto mb-6 bg-[#0D2420] border-2 border-dashed border-[#2A4A42] rounded-2xl flex flex-col items-center justify-center gap-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(212,168,83,0.03)] to-transparent pointer-events-none"></div>
              <div className="text-5xl filter grayscale-[30%]">📱</div>
              <div className="text-xs text-[#8A7560]">QR Code will appear here</div>
            </div>

            {/* Steps */}
            <div className="text-left mb-6">
              <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-4">How to connect:</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-4 pb-3 border-b border-[rgba(42,74,66,0.4)]">
                  <div className="w-6 h-6 rounded-full bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center text-xs font-semibold text-[#D4A853] flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-sm text-[#C4A882] leading-relaxed">
                    Open WhatsApp on your phone and go to Settings → Linked Devices
                  </p>
                </div>
                <div className="flex items-start gap-4 pb-3 border-b border-[rgba(42,74,66,0.4)]">
                  <div className="w-6 h-6 rounded-full bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center text-xs font-semibold text-[#D4A853] flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-sm text-[#C4A882] leading-relaxed">
                    Tap "Link a device" and scan the QR code above
                  </p>
                </div>
                <div className="flex items-start gap-4 pb-3 border-b border-[rgba(42,74,66,0.4)]">
                  <div className="w-6 h-6 rounded-full bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center text-xs font-semibold text-[#D4A853] flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-sm text-[#C4A882] leading-relaxed">
                    Wait for the connection to establish automatically
                  </p>
                </div>
                <div className="flex items-start gap-4 pb-3 border-b border-[rgba(42,74,66,0.4)]">
                  <div className="w-6 h-6 rounded-full bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center text-xs font-semibold text-[#D4A853] flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <p className="text-sm text-[#C4A882] leading-relaxed">
                    Verify your phone number appears in the dashboard
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center text-xs font-semibold text-[#D4A853] flex-shrink-0 mt-0.5">
                    5
                  </div>
                  <p className="text-sm text-[#C4A882] leading-relaxed">
                    Configure your bot settings and activate auto-reply
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsConnected(true)}
              className="w-full py-3 bg-gradient-to-r from-[#D4A853] to-[#C4983F] text-[#0D2420] font-semibold rounded-lg hover:transform hover:translateY-[-2px] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)] transition-all"
            >
              Simulate Connection
            </button>
          </div>
        </div>
      ) : (
        /* Connected State */
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Connection Status Card */}
          <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-10 text-center">
            <div className="text-6xl mb-4 animate-bounce">✅</div>
            <div className="font-serif text-3xl font-bold text-[#D4A853] mb-2">+92 301 1234567</div>
            <div className="text-sm text-[#8A7560] mb-7">Connected since May 1, 2025</div>
            <button 
              onClick={() => setIsConnected(false)}
              className="px-6 py-2 border border-[rgba(224,92,92,0.3)] text-[#E05C5C] rounded-lg hover:bg-[rgba(224,92,92,0.08)] hover:border-[#E05C5C] transition-all"
            >
              Disconnect
            </button>
          </div>

          {/* Bot Settings Card */}
          <div className="bg-gradient-to-br from-[#1A3D35] to-[#142E28] border border-[#2A4A42] rounded-2xl p-6">
            <h3 className="font-serif text-lg font-bold text-[#F7E7CE] mb-6">Bot Settings</h3>
            
            {/* Auto Reply Toggle */}
            <div className="flex items-center justify-between py-4 border-b border-[rgba(42,74,66,0.4)]">
              <div>
                <div className="text-sm text-[#F7E7CE] font-medium">Auto-Reply</div>
                <div className="text-xs text-[#8A7560] mt-1">Automatically respond to incoming messages</div>
              </div>
              <label className="relative w-11 h-6 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoReply}
                  onChange={(e) => setAutoReply(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-full h-full rounded-full transition-colors ${
                  autoReply ? 'bg-[#D4A853]' : 'bg-[#2A4A42]'
                }`}></div>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  autoReply ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </label>
            </div>

            {/* Office Hours Toggle */}
            <div className="flex items-center justify-between py-4">
              <div>
                <div className="text-sm text-[#F7E7CE] font-medium">Office Hours Only</div>
                <div className="text-xs text-[#8A7560] mt-1">Only respond during business hours (9 AM - 6 PM)</div>
              </div>
              <label className="relative w-11 h-6 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={officeHours}
                  onChange={(e) => setOfficeHours(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-full h-full rounded-full transition-colors ${
                  officeHours ? 'bg-[#D4A853]' : 'bg-[#2A4A42]'
                }`}></div>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  officeHours ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </label>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
