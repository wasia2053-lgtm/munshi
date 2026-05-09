import React from 'react'

export default function TermsOfService() {
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
            Terms of Service
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
            Welcome to Munshi (munshi.pk). These Terms of Service govern your use of our 
            WhatsApp AI-powered SaaS platform. By accessing or using our service, you agree to these terms.
          </p>
        </div>

        {/* Services */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Services
          </h2>
          <p style={{ 
            lineHeight: '1.6',
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            Munshi provides automated WhatsApp customer support through AI-powered chatbots for Pakistani businesses. 
            Our services include message automation, customer inquiry handling, and business intelligence analytics.
          </p>
        </div>

        {/* User Responsibilities */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            User Responsibilities
          </h2>
          <ul style={{ 
            paddingLeft: '20px',
            lineHeight: '1.6',
            fontSize: '16px'
          }}>
            <li style={{ marginBottom: '8px' }}>Provide accurate business information</li>
            <li style={{ marginBottom: '8px' }}>Maintain active WhatsApp Business account</li>
            <li style={{ marginBottom: '8px' }}>Ensure lawful use of the service</li>
            <li style={{ marginBottom: '8px' }}>Monitor bot responses for accuracy</li>
            <li style={{ marginBottom: '8px' }}>Report technical issues promptly</li>
          </ul>
        </div>

        {/* Payment Terms */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Payment Terms
          </h2>
          <p style={{ 
            lineHeight: '1.6',
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            Munshi operates on a subscription basis with the following pricing:
          </p>
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
          <p style={{ 
            lineHeight: '1.6',
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            All payments are processed in Pakistani Rupees (PKR) and are non-refundable except as specified in our Refund Policy.
          </p>
        </div>

        {/* Service Availability */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Service Availability
          </h2>
          <p style={{ 
            lineHeight: '1.6',
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            While we strive for 99.9% uptime, we cannot guarantee uninterrupted service. 
            WhatsApp API availability, internet connectivity, and other factors beyond our control may affect service delivery.
          </p>
        </div>

        {/* Limitation of Liability */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Limitation of Liability
          </h2>
          <p style={{ 
            lineHeight: '1.6',
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            Munshi is not liable for lost profits, business interruption, or any indirect damages 
            arising from your use of our service. Our total liability shall not exceed the amount 
            paid by you in the preceding three months.
          </p>
        </div>

        {/* Termination */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#D4A853'
          }}>
            Termination
          </h2>
          <p style={{ 
            lineHeight: '1.6',
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            Either party may terminate this agreement with 30 days' written notice. Upon termination, 
            you will lose access to the service and all data will be permanently deleted after 30 days.
          </p>
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
            If you have questions about these Terms of Service, please contact us:
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
