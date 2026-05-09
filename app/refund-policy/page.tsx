import React from 'react'

export default function RefundPolicy() {
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
            Refund Policy
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
            At Munshi (munshi.pk), we want you to be completely satisfied with our WhatsApp AI SaaS platform. 
            This Refund Policy outlines the conditions under which we offer refunds for our subscription services.
          </p>
        </div>

        {/* Refund Eligibility */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Refund Eligibility
          </h2>
          <p style={{ 
            lineHeight: '1.6',
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            You may be eligible for a refund under the following circumstances:
          </p>
          <ul style={{ 
            paddingLeft: '20px',
            lineHeight: '1.6',
            fontSize: '16px'
          }}>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Service Downtime:</strong> If our service experiences more than 24 hours of 
              consecutive downtime in a month
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Technical Issues:</strong> If critical features are non-functional for more than 7 days 
              and we cannot resolve them within 48 hours of your report
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Billing Errors:</strong> If you are charged incorrectly due to our system error
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Account Cancellation:</strong> Within 7 days of initial subscription
            </li>
          </ul>
        </div>

        {/* Non-Refundable Items */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Non-Refundable Items
          </h2>
          <p style={{ 
            lineHeight: '1.6',
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            The following are not eligible for refunds:
          </p>
          <ul style={{ 
            paddingLeft: '20px',
            lineHeight: '1.6',
            fontSize: '16px'
          }}>
            <li style={{ marginBottom: '8px' }}>Partial month usage (no prorated refunds)</li>
            <li style={{ marginBottom: '8px' }}>WhatsApp API or third-party service issues</li>
            <li style={{ marginBottom: '8px' }}>User error or misuse of service</li>
            <li style={{ marginBottom: '8px' }}>Internet connectivity issues on your end</li>
            <li style={{ marginBottom: '8px' }}>After 7 days of subscription activation</li>
          </ul>
        </div>

        {/* Refund Process */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Refund Process
          </h2>
          <ol style={{ 
            paddingLeft: '20px',
            lineHeight: '1.6',
            fontSize: '16px'
          }}>
            <li style={{ marginBottom: '8px' }}>
              Contact us at <strong style={{ color: '#D4A853' }}>support@munshi.pk</strong> with your refund request
            </li>
            <li style={{ marginBottom: '8px' }}>
              Provide your account details and reason for refund
            </li>
            <li style={{ marginBottom: '8px' }}>
              Our team will review your request within 5 business days
            </li>
            <li style={{ marginBottom: '8px' }}>
              Approved refunds are processed within 7-10 business days
            </li>
            <li style={{ marginBottom: '8px' }}>
              Refunds are issued in Pakistani Rupees (PKR) via original payment method
            </li>
          </ol>
        </div>

        {/* PKR Pricing Reference */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Pricing Reference (PKR)
          </h2>
          <div style={{ 
            backgroundColor: '#0D2420',
            border: '1px solid #2A4A42',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '16px'
          }}>
            <ul style={{ 
              paddingLeft: '20px',
              lineHeight: '1.6',
              fontSize: '16px'
            }}>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#D4A853' }}>Basic Plan:</strong> PKR 2,999/month
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#D4A853' }}>Professional Plan:</strong> PKR 4,999/month
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#D4A853' }}>Enterprise Plan:</strong> PKR 9,999/month
              </li>
            </ul>
          </div>
        </div>

        {/* Refund Method */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Refund Method
          </h2>
          <p style={{ 
            lineHeight: '1.6',
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            Refunds are processed using the same method as original payment:
          </p>
          <ul style={{ 
            paddingLeft: '20px',
            lineHeight: '1.6',
            fontSize: '16px'
          }}>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Credit Card:</strong> Refund to original card (7-10 business days)
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>JazzCash/EasyPaisa:</strong> Refund to mobile account (3-5 business days)
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#D4A853' }}>Bank Transfer:</strong> Direct bank refund (5-7 business days)
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
            For refund requests or questions about this policy, please contact us:
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
