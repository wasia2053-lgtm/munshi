import React from 'react'

export default function PrivacyPolicy() {
  return (
    <div style={{ 
      backgroundColor: '#102C26',
      minHeight: '100vh',
      color: '#F7E7CE',
      fontFamily: "'DM Sans', sans-serif",
      padding: '20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700',
            marginBottom: '16px',
            fontFamily: "'Cormorant Garamond', serif",
            color: '#F7E7CE'
          }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '16px', color: '#8A7560' }}>
            Effective Date: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Introduction */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Introduction
          </h2>
          <p style={{ 
            lineHeight: '1.6',
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            Munshi (munshi.pk) is a WhatsApp AI-powered SaaS platform designed to help Pakistani businesses 
            automate customer interactions through intelligent chatbots. This Privacy Policy explains how we collect, 
            use, and protect your information when you use our services.
          </p>
        </div>

        {/* Information We Collect */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Information We Collect
          </h2>
          
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600',
              marginBottom: '12px',
              color: '#F7E7CE'
            }}>
              Personal Information
            </h3>
            <ul style={{ 
              paddingLeft: '20px',
              lineHeight: '1.6',
              fontSize: '16px'
            }}>
              <li style={{ marginBottom: '8px' }}>Full name and contact details</li>
              <li style={{ marginBottom: '8px' }}>Phone numbers</li>
              <li style={{ marginBottom: '8px' }}>Business information (name, industry, size)</li>
              <li style={{ marginBottom: '8px' }}>Email addresses for account management</li>
            </ul>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600',
              marginBottom: '12px',
              color: '#F7E7CE'
            }}>
              WhatsApp Data
            </h3>
            <ul style={{ 
              paddingLeft: '20px',
              lineHeight: '1.6',
              fontSize: '16px'
            }}>
              <li style={{ marginBottom: '8px' }}>Incoming WhatsApp messages</li>
              <li style={{ marginBottom: '8px' }}>Customer phone numbers</li>
              <li style={{ marginBottom: '8px' }}>Message timestamps and metadata</li>
              <li style={{ marginBottom: '8px' }}>Bot response data for training purposes</li>
            </ul>
          </div>
        </div>

        {/* How We Use Your Data */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            How We Use Your Data
          </h2>
          <ul style={{ 
            paddingLeft: '20px',
            lineHeight: '1.6',
            fontSize: '16px'
          }}>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>AI Training:</strong> To improve bot responses and accuracy
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Service Delivery:</strong> To provide automated customer support
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Analytics:</strong> To monitor service performance and usage
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Account Management:</strong> To manage your subscription and settings
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Customer Support:</strong> To assist with technical issues
            </li>
          </ul>
        </div>

        {/* Third Parties */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Third-Party Services
          </h2>
          <p style={{ 
            lineHeight: '1.6',
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            We use the following trusted third-party services to operate our platform:
          </p>
          <ul style={{ 
            paddingLeft: '20px',
            lineHeight: '1.6',
            fontSize: '16px'
          }}>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Meta (WhatsApp Business API):</strong> For message delivery and WhatsApp integration
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Supabase:</strong> For secure database storage and authentication
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Groq:</strong> For AI model processing and responses
            </li>
          </ul>
        </div>

        {/* Data Security */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Data Security
          </h2>
          <p style={{ 
            lineHeight: '1.6',
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            We implement industry-standard security measures including:
          </p>
          <ul style={{ 
            paddingLeft: '20px',
            lineHeight: '1.6',
            fontSize: '16px'
          }}>
            <li style={{ marginBottom: '8px' }}>End-to-end encryption for data transmission</li>
            <li style={{ marginBottom: '8px' }}>Secure database storage with Supabase</li>
            <li style={{ marginBottom: '8px' }}>Regular security audits and updates</li>
            <li style={{ marginBottom: '8px' }}>Access controls and authentication</li>
          </ul>
        </div>

        {/* Data Retention */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Data Retention
          </h2>
          <p style={{ 
            lineHeight: '1.6',
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            We retain your data for as long as necessary to provide our services and comply with legal obligations. 
            You may request data deletion at any time using the contact information below.
          </p>
        </div>

        {/* Your Rights */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Your Data Rights
          </h2>
          <ul style={{ 
            paddingLeft: '20px',
            lineHeight: '1.6',
            fontSize: '16px'
          }}>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Access:</strong> Request a copy of your personal data
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Correction:</strong> Update inaccurate or incomplete information
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Deletion:</strong> Request removal of your personal data
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Portability:</strong> Transfer your data to another service
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Contact Us
          </h2>
          <p style={{ 
            lineHeight: '1.6',
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            If you have questions about this Privacy Policy or need to exercise your data rights, 
            please contact us:
          </p>
          <div style={{ 
            backgroundColor: '#0D2420',
            border: '1px solid #2A4A42',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#D4A853'
            }}>
              support@munshi.pk
            </p>
            <p style={{ fontSize: '14px', color: '#8A7560' }}>
              Munshi Team<br />
              munshi.pk
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center',
          paddingTop: '32px',
          borderTop: '1px solid #2A4A42',
          marginTop: '32px'
        }}>
          <p style={{ fontSize: '14px', color: '#8A7560' }}>
            © {new Date().getFullYear()} Munshi. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
