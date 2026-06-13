import PolicyLayout from '@/components/PolicyLayout'

export const metadata = {
  title: 'Terms of Service | Munshi AI',
  description: 'Terms and conditions for using Munshi AI.',
}

export default function TermsOfService() {
  const sections = [
    {
      title: 'Agreement to Terms',
      content: (
        <p>
          By accessing or using Munshi AI ("Service") at munshi.pk, you agree to be bound by these Terms of Service.
          If you do not agree, do not use the Service. These terms apply to all users, including businesses and individuals.
        </p>
      )
    },
    {
      title: 'Description of Service',
      content: (
        <p>
          Munshi AI provides an AI-powered WhatsApp automation platform that allows businesses to train a chatbot
          on their knowledge base and automatically respond to customer messages on WhatsApp. The Service includes
          website scraping, PDF training, analytics, conversation management, and billing features.
        </p>
      )
    },
    {
      title: 'Eligibility & Account',
      content: (
        <ul>
          <li>You must be at least 18 years old to use this Service</li>
          <li>You must provide accurate and complete information when creating an account</li>
          <li>You are responsible for maintaining the security of your account credentials</li>
          <li>You are responsible for all activity that occurs under your account</li>
          <li>One account per business — multiple accounts for the same business are prohibited</li>
        </ul>
      )
    },
    {
      title: 'Acceptable Use',
      content: (
        <>
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>Send spam, unsolicited messages, or bulk marketing without recipient consent</li>
            <li>Violate Meta's WhatsApp Business Policy or Terms of Service</li>
            <li>Engage in illegal, fraudulent, or deceptive activities</li>
            <li>Infringe on intellectual property rights of others</li>
            <li>Transmit malware, viruses, or harmful code</li>
            <li>Harass, abuse, or harm any person</li>
            <li>Attempt to reverse-engineer, hack, or disrupt the platform</li>
          </ul>
          <p>Violation of acceptable use may result in immediate account suspension without refund.</p>
        </>
      )
    },
    {
      title: 'Subscription & Pricing',
      content: (
        <>
          <p>Munshi AI operates on a monthly subscription basis:</p>
          <ul>
            <li><strong>Starter:</strong> Free — 50 messages/month</li>
            <li><strong>Growth:</strong> PKR 7,000 / $25 per month — 5,000 messages/month</li>
            <li><strong>Pro:</strong> PKR 30,000 / $99 per month — 50,000 messages/month</li>
          </ul>
          <p>Prices are subject to change with 30 days' notice. Subscriptions auto-renew monthly unless cancelled.
            Message limits reset at the start of each billing cycle. Unused messages do not carry over.</p>
        </>
      )
    },
    {
      title: 'Payment',
      content: (
        <>
          <p>Payments are accepted via:</p>
          <ul>
            <li><strong>Pakistan:</strong> JazzCash, EasyPaisa, Bank Transfer (via Safepay)</li>
            <li><strong>International:</strong> Credit/Debit cards, Apple Pay, Google Pay (via Dodo Payments)</li>
          </ul>
          <p>All payments are final unless eligible for a refund under our Refund Policy.
            Failed payments will result in service suspension until resolved.</p>
        </>
      )
    },
    {
      title: 'Service Availability',
      content: (
        <p>
          We strive for 99.9% uptime but cannot guarantee uninterrupted service.
          Scheduled maintenance will be communicated in advance where possible.
          Service interruptions caused by Meta's WhatsApp API, internet providers,
          or other third-party services are outside our control and do not automatically
          qualify for refunds.
        </p>
      )
    },
    {
      title: 'Intellectual Property',
      content: (
        <>
          <p>
            All platform code, design, branding, and features are owned by Munshi AI.
            You retain ownership of your business data, training content, and conversation history.
          </p>
          <p>
            By uploading training data to the platform, you grant us a limited license to process
            that content solely to provide the Service. We do not claim ownership of your content.
          </p>
        </>
      )
    },
    {
      title: 'Limitation of Liability',
      content: (
        <p>
          To the maximum extent permitted by law, Munshi AI is not liable for indirect, incidental,
          special, or consequential damages, including lost profits or business interruption,
          arising from your use of the Service. Our total cumulative liability shall not exceed
          the total amount you paid us in the three months preceding the claim.
        </p>
      )
    },
    {
      title: 'Termination',
      content: (
        <>
          <p>You may cancel your subscription at any time from the Billing page. Cancellation takes effect at the end of the current billing period.</p>
          <p>We reserve the right to suspend or terminate accounts that violate these Terms, with or without notice depending on the severity of the violation.</p>
          <p>Upon termination, your data will be retained for 30 days before permanent deletion, giving you time to export any necessary information.</p>
        </>
      )
    },
    {
      title: 'Governing Law',
      content: (
        <p>
          These Terms are governed by the laws of the Islamic Republic of Pakistan.
          Any disputes shall be resolved through good-faith negotiation first,
          and if unresolved, through the courts of Karachi, Pakistan.
        </p>
      )
    },
    {
      title: 'Contact Us',
      content: (
        <>
          <p>For questions about these Terms, contact us:</p>
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
      title="Terms of Service"
      subtitle="Please read these terms carefully before using Munshi AI."
      effectiveDate="January 1, 2025"
      badge="Legal"
      sections={sections}
    />
  )
}