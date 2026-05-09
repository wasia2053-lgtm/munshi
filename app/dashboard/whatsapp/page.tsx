'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'

export default function WhatsAppPage() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'not_connected'>('not_connected')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [bizData, setBizData] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchConnectionStatus()
  }, [])

  const fetchConnectionStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status', { credentials: 'include' })
      const data = await res.json()
      
      if (data.whatsapp_status === 'connected') {
        setConnectionStatus('connected')
        setWhatsappPhoneId(data.whatsapp_phone_id || '')
        setPhoneNumber(data.whatsapp_number || '')
      }
    } catch (error) {
      console.error('Connection status error:', error)
    }
  }

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setMessage(`${type} copied to clipboard!`)
    setMessageType('success')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      setMessage('Please enter a phone number')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: testPhone.trim() })
      })

      const result = await res.json()
      
      if (result.success) {
        setMessage('Test message sent successfully!')
        setMessageType('success')
        setTestPhone('')
      } else {
        setMessage(result.error || 'Failed to send test message')
        setMessageType('error')
      }
    } catch (error: any) {
      setMessage('Network error: ' + error.message)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const webhookUrl = 'https://unreversed-latoya-masculinely.ngrok-free.dev/api/whatsapp/webhook'
  const verifyToken = 'munshi_verify_123'

  return (
    <DashboardLayout>
      <div style={{ 
        backgroundColor: '#102C26',
        minHeight: '100vh',
        padding: '16px',
        fontFamily: "'DM Sans', sans-serif"
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {/* Page Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ 
              color: '#F7E7CE', 
              fontSize: '28px', 
              fontWeight: '700',
              marginBottom: '8px',
              fontFamily: "'Cormorant Garamond', serif"
            }}>
              WhatsApp Integration
            </h1>
            <p style={{ color: '#8A7560', fontSize: '14px' }}>
              Manage your WhatsApp business connection and test messaging
            </p>
          </div>

          {/* CARD 1 - Connection Status */}
          <div style={{
            backgroundColor: '#0D2420',
            border: '1px solid #2A4A42',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '16px'
          }}>
            <h2 style={{ 
              color: '#F7E7CE', 
              fontSize: '18px', 
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              Connection Status
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: connectionStatus === 'connected' ? '#4CAF82' : '#EF4444'
              }} />
              <span style={{
                color: connectionStatus === 'connected' ? '#4CAF82' : '#EF4444',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {connectionStatus === 'connected' ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                color: '#8A7560', 
                fontSize: '12px', 
                fontWeight: '500',
                display: 'block',
                marginBottom: '4px'
              }}>
                Phone Number
              </label>
              <div style={{
                backgroundColor: '#1A3D35',
                padding: '12px 16px',
                borderRadius: '8px',
                color: '#F7E7CE',
                fontSize: '14px',
                fontWeight: '600',
                border: '1px solid #2A4A42'
              }}>
                {phoneNumber || 'Not set'}
              </div>
            </div>

            <div>
              <label style={{ 
                color: '#8A7560', 
                fontSize: '12px', 
                fontWeight: '500',
                display: 'block',
                marginBottom: '4px'
              }}>
                WhatsApp Phone Number ID
              </label>
              <div style={{
                backgroundColor: '#1A3D35',
                padding: '12px 16px',
                borderRadius: '8px',
                color: '#F7E7CE',
                fontSize: '14px',
                border: '1px solid #2A4A42',
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                {whatsappPhoneId || 'Not available'}
              </div>
            </div>
          </div>

          {/* CARD 2 - Send Test Message */}
          <div style={{
            backgroundColor: '#0D2420',
            border: '1px solid #2A4A42',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '16px'
          }}>
            <h2 style={{ 
              color: '#F7E7CE', 
              fontSize: '18px', 
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              Send Test Message
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                color: '#8A7560', 
                fontSize: '12px', 
                fontWeight: '500',
                display: 'block',
                marginBottom: '8px'
              }}>
                Phone Number (Pakistani format: 923xxxxxxxx)
              </label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="923xxxxxxxx"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#1A3D35',
                  border: '1px solid #2A4A42',
                  borderRadius: '8px',
                  color: '#F7E7CE',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#D4A853'}
                onBlur={(e) => e.target.style.borderColor = '#2A4A42'}
              />
            </div>

            <button
              onClick={handleSendTest}
              disabled={loading || !testPhone.trim()}
              style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#8A7560' : '#D4A853',
                color: '#102C26',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Sending...' : 'Send Test Message'}
            </button>

            {message && (
              <div style={{
                marginTop: '12px',
                padding: '12px 16px',
                backgroundColor: messageType === 'success' ? '#1A3D35' : '#2A1A1A',
                border: `1px solid ${messageType === 'success' ? '#4CAF82' : '#EF4444'}`,
                borderRadius: '8px',
                color: messageType === 'success' ? '#4CAF82' : '#EF4444',
                fontSize: '13px'
              }}>
                {message}
              </div>
            )}
          </div>

          {/* CARD 3 - Webhook Information */}
          <div style={{
            backgroundColor: '#0D2420',
            border: '1px solid #2A4A42',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h2 style={{ 
              color: '#F7E7CE', 
              fontSize: '18px', 
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              Webhook Information
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <label style={{ 
                  color: '#8A7560', 
                  fontSize: '12px', 
                  fontWeight: '500'
                }}>
                  Webhook URL
                </label>
                <button
                  onClick={() => handleCopy(webhookUrl, 'Webhook URL')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#D4A853',
                    color: '#102C26',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Copy
                </button>
              </div>
              <div style={{
                backgroundColor: '#1A3D35',
                padding: '12px 16px',
                borderRadius: '8px',
                color: '#F7E7CE',
                fontSize: '14px',
                border: '1px solid #2A4A42',
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                {webhookUrl}
              </div>
            </div>

            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <label style={{ 
                  color: '#8A7560', 
                  fontSize: '12px', 
                  fontWeight: '500'
                }}>
                  Verify Token
                </label>
                <button
                  onClick={() => handleCopy(verifyToken, 'Verify Token')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#D4A853',
                    color: '#102C26',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Copy
                </button>
              </div>
              <div style={{
                backgroundColor: '#1A3D35',
                padding: '12px 16px',
                borderRadius: '8px',
                color: '#F7E7CE',
                fontSize: '14px',
                border: '1px solid #2A4A42',
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                {verifyToken}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}