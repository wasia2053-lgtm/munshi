import PolicyLayout from '@/components/PolicyLayout'

export const metadata = {
  title: 'Privacy Policy | Munshi AI',
  description: 'How Munshi AI collects, uses, and protects your data.',
}

export default function PrivacyPolicy() {
  const sections = [
    {
      title: 'Introduction',
      content: (
        <p>
          Munshi AI ("we", "us", "our") operates munshi.pk — a WhatsApp AI automation platform for small and medium businesses.
          This Privacy Policy explains what data we collect, how we use it, and your rights regarding that data.
          By using our services, you agree to the practices described here.
        </p>
      )
    },
    {
      title: 'Information We Collect',
      content: (
        <>
          <p><strong>Account Information:</strong> When you sign up, we collect your name, email address, and business details.</p>
          <p><strong>WhatsApp Data:</strong> We process incoming and outgoing WhatsApp messages, customer phone numbers, message timestamps, and conversation history to deliver our service.</p>
          <p><strong>Training Data:</strong> Website content, PDFs, and text you upload to train your AI bot.</p>
          <p><strong>Usage Data:</strong> Pages visited, features used, message counts, and performance metrics collected automatically to improve the platform.</p>
          <p><strong>Payment Data:</strong> Subscription plan and payment reference numbers. We do not store full card details — payments are processed by our payment partners.</p>
        </>
      )
    },
    {
      title: 'How We Use Your Data',
      content: (
        <ul>
          <li><strong>Service Delivery:</strong> To operate your AI bot, process WhatsApp messages, and maintain your knowledge base.</li>
          <li><strong>Account Management:</strong> To manage your subscription, billing, and account settings.</li>
          <li><strong>Platform Improvement:</strong> To analyze usage patterns and improve features. We never use your customer conversations to train shared AI models.</li>
          <li><strong>Security:</strong> To detect fraud, abuse, and unauthorized access.</li>
          <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations in Pakistan and internationally.</li>
        </ul>
      )
    },
    {
      title: 'Data Sharing & Third Parties',
      content: (
        <>
          <p>We do not sell your data. We share data only with trusted service providers necessary to operate the platform:</p>
          <ul>
            <li><strong>Meta (WhatsApp Business API):</strong> Message delivery and WhatsApp integration.</li>
            <li><strong>Supabase:</strong> Secure database storage and authentication infrastructure.</li>
            <li><strong>Groq:</strong> AI inference for bot responses. Your data is processed but not stored or used for training by Groq.</li>
            <li><strong>Vercel:</strong> Application hosting and delivery.</li>
          </ul>
        </>
      )
    },
    {
      title: 'Data Security',
      content: (
        <>
          <p>We implement industry-standard security measures:</p>
          <ul>
            <li>All data transmitted over TLS/HTTPS encryption</li>
            <li>Database access restricted via role-based permissions</li>
            <li>API keys stored as environment variables, never in code</li>
            <li>Regular security reviews and dependency updates</li>
          </ul>
        </>
      )
    },
    {
      title: 'Data Retention',
      content: (
        <>
          <ul>
            <li><strong>Conversation history:</strong> Retained for the duration of your subscription</li>
            <li><strong>Account data:</strong> Retained until account deletion is requested</li>
            <li><strong>Billing records:</strong> Retained for 7 years as required by Pakistani tax law</li>
          </ul>
          <p>When you delete your account, all personal data is permanently deleted within 30 days, except where legally required.</p>
        </>
      )
    },
    {
      title: 'Your Rights',
      content: (
        <ul>
          <li><strong>Access:</strong> Request a copy of your personal data</li>
          <li><strong>Correction:</strong> Request correction of inaccurate data</li>
          <li><strong>Deletion:</strong> Request deletion of your account and data</li>
          <li><strong>Portability:</strong> Request your data in machine-readable format</li>
          <li><strong>Objection:</strong> Object to certain processing activities</li>
        </ul>
      )
    },
    {
      title: 'Contact Us',
      content: (
        <>
          <p>For privacy questions or data requests, contact our team:</p>
          <div className="contact-card">
            <div className="contact-email">support@munshi.pk</div>
            <div className="contact-sub">Munshi AI — munshi.pk · We respond within 2 business days.</div>
          </div>
        </>
      )
    }
  ]

  return (
    <PolicyLayout
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your information."
      effectiveDate="January 1, 2025"
      badge="Legal"
      sections={sections}
    />
  )
}