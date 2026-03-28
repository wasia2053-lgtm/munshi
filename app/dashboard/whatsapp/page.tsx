'use client'
export const dynamic = 'force-dynamic';

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
      <style>{`
        /* ── STATUS BANNER ── */
        .wa-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 14px;
          font-size: 14px;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .wa-banner-icon { font-size: 20px; flex-shrink: 0; }

        /* ── CARD ── */
        .wa-card {
          background: linear-gradient(135deg, #1A3D35, #142E28);
          border: 1px solid #2A4A42;
          border-radius: 20px;
          padding: 32px;
        }

        /* ── QR BOX ── */
        .qr-box {
          width: 200px;
          height: 200px;
          margin: 0 auto 24px;
          background: #0D2420;
          border: 2px dashed #2A4A42;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }
        .qr-emoji { font-size: 44px; }
        .qr-label { font-size: 11px; color: #8A7560; text-align: center; padding: 0 12px; }

        /* ── STEPS ── */
        .steps-list { text-align: left; margin-bottom: 24px; }
        .steps-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          font-weight: 700;
          color: #F7E7CE;
          margin-bottom: 16px;
        }
        .step-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(42,74,66,0.4);
        }
        .step-row:last-child { border-bottom: none; padding-bottom: 0; }
        .step-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(212,168,83,0.1);
          border: 1px solid rgba(212,168,83,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          color: #D4A853;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .step-text { font-size: 13px; color: #C4A882; line-height: 1.6; }

        /* ── CONNECT BTN ── */
        .btn-connect {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #D4A853, #C4983F);
          color: #0D2420;
          font-size: 15px;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-connect:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(212,168,83,0.3);
        }

        /* ── CONNECTED STATE ── */
        .connected-card {
          background: linear-gradient(135deg, #1A3D35, #142E28);
          border: 1px solid #2A4A42;
          border-radius: 20px;
          padding: 36px 24px;
          text-align: center;
          margin-bottom: 20px;
        }
        .connected-emoji { font-size: 52px; margin-bottom: 16px; display: block; }
        .connected-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 700;
          color: #D4A853;
          margin-bottom: 6px;
        }
        .connected-since { font-size: 13px; color: #8A7560; margin-bottom: 24px; }
        .btn-disconnect {
          padding: 9px 24px;
          border: 1px solid rgba(224,92,92,0.35);
          color: #E05C5C;
          background: transparent;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-disconnect:hover {
          background: rgba(224,92,92,0.08);
          border-color: #E05C5C;
        }

        /* ── SETTINGS CARD ── */
        .settings-card {
          background: linear-gradient(135deg, #1A3D35, #142E28);
          border: 1px solid #2A4A42;
          border-radius: 20px;
          padding: 24px;
        }
        .settings-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 700;
          color: #F7E7CE;
          margin-bottom: 20px;
        }
        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid rgba(42,74,66,0.4);
        }
        .toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
        .toggle-label { font-size: 14px; color: #F7E7CE; font-weight: 500; margin-bottom: 3px; }
        .toggle-desc { font-size: 12px; color: #8A7560; line-height: 1.4; }
        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-track {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          transition: background 0.2s;
        }
        .toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 640px) {
          .wa-card { padding: 20px 16px; }
          .qr-box { width: 160px; height: 160px; }
          .qr-emoji { font-size: 36px; }
          .connected-card { padding: 28px 16px; }
          .connected-number { font-size: 22px; }
          .connected-emoji { font-size: 44px; }
          .settings-card { padding: 18px 14px; }
          .toggle-row { gap: 12px; }
          .toggle-desc { font-size: 11px; }
          .step-text { font-size: 12px; }
        }
      `}</style>

      {/* Status Banner */}
      <div
        className="wa-banner"
        style={{
          background: isConnected
            ? 'rgba(76,175,130,0.08)'
            : 'rgba(240,160,48,0.07)',
          border: `1px solid ${isConnected ? 'rgba(76,175,130,0.25)' : 'rgba(240,160,48,0.25)'}`,
          color: isConnected ? '#4CAF82' : '#F0A030',
        }}
      >
        <span className="wa-banner-icon">{isConnected ? '✅' : '⚠️'}</span>
        <span>
          {isConnected
            ? 'Your WhatsApp is successfully connected and active'
            : 'Connect your WhatsApp number to start automating customer responses'}
        </span>
      </div>

      {!isConnected ? (
        /* ── DISCONNECTED STATE ── */
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="wa-card" style={{ textAlign: 'center' }}>

            {/* QR Code Box */}
            <div className="qr-box">
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(212,168,83,0.04), transparent)',
                pointerEvents: 'none'
              }} />
              <span className="qr-emoji">📱</span>
              <span className="qr-label">QR Code will appear here</span>
            </div>

            {/* Steps */}
            <div className="steps-list">
              <div className="steps-title">How to connect:</div>
              {[
                'Open WhatsApp on your phone and go to Settings → Linked Devices',
                'Tap "Link a device" and scan the QR code above',
                'Wait for the connection to establish automatically',
                'Verify your phone number appears in the dashboard',
                'Configure your bot settings and activate auto-reply',
              ].map((text, i) => (
                <div className="step-row" key={i}>
                  <div className="step-num">{i + 1}</div>
                  <p className="step-text">{text}</p>
                </div>
              ))}
            </div>

            {/* Connect Button */}
            <button className="btn-connect" onClick={() => setIsConnected(true)}>
              🔗 Simulate Connection
            </button>
          </div>
        </div>
      ) : (
        /* ── CONNECTED STATE ── */
        <div style={{ maxWidth: 520, margin: '0 auto' }}>

          {/* Connection Status Card */}
          <div className="connected-card">
            <span className="connected-emoji">✅</span>
            <div className="connected-number">+92 301 1234567</div>
            <div className="connected-since">Connected since May 1, 2025</div>
            <button className="btn-disconnect" onClick={() => setIsConnected(false)}>
              Disconnect
            </button>
          </div>

          {/* Bot Settings Card */}
          <div className="settings-card">
            <div className="settings-title">Bot Settings</div>

            {/* Auto Reply */}
            <div className="toggle-row">
              <div>
                <div className="toggle-label">Auto-Reply</div>
                <div className="toggle-desc">Automatically respond to incoming messages</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={autoReply}
                  onChange={e => setAutoReply(e.target.checked)}
                />
                <div
                  className="toggle-track"
                  style={{ background: autoReply ? '#D4A853' : '#2A4A42' }}
                />
                <div
                  className="toggle-thumb"
                  style={{ transform: autoReply ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </label>
            </div>

            {/* Office Hours */}
            <div className="toggle-row">
              <div>
                <div className="toggle-label">Office Hours Only</div>
                <div className="toggle-desc">Only respond during business hours (9 AM – 6 PM)</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={officeHours}
                  onChange={e => setOfficeHours(e.target.checked)}
                />
                <div
                  className="toggle-track"
                  style={{ background: officeHours ? '#D4A853' : '#2A4A42' }}
                />
                <div
                  className="toggle-thumb"
                  style={{ transform: officeHours ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </label>
            </div>
          </div>

        </div>
      )}
    </DashboardLayout>
  )
}