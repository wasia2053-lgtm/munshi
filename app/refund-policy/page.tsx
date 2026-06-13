import PolicyLayout from '@/components/PolicyLayout'

export const metadata = {
  title: 'Refund Policy | Munshi AI',
  description: 'Munshi AI refund and cancellation policy.',
}

export default function RefundPolicy() {
  const sections = [
    {
      title: 'Overview',
      content: (
        <p>
          At Munshi AI, we want you to be satisfied with our service. This Refund Policy outlines
          the conditions under which refunds are granted. We offer a free tier so you can evaluate
          the platform before committing to a paid plan — we encourage you to test thoroughly before upgrading.
        </p>
      )
    },
    {
      title: 'Refund Eligibility',
      content: (
        <>
          <p>You may request a refund under the following circumstances:</p>
          <ul>
            <li><strong>7-Day New Subscriber Guarantee:</strong> If you are unsatisfied within 7 days of your first paid subscription, you are eligible for a full refund — no questions asked.</li>
            <li><strong>Service Downtime:</strong> If our platform experiences more than 24 consecutive hours of downtime in a billing month, you are eligible for a prorated credit or refund for that period.</li>
            <li><strong>Critical Feature Failure:</strong> If a core feature (WhatsApp bot replies, training, dashboard) is non-functional for more than 7 consecutive days despite our best efforts to resolve it, you are eligible for a refund for that billing period.</li>
            <li><strong>Billing Error:</strong> If you were charged an incorrect amount due to a system error on our end, you will receive a full refund of the overcharged amount.</li>
            <li><strong>Duplicate Charge:</strong> If you were charged twice for the same subscription period.</li>
          </ul>
        </>
      )
    },
    {
      title: 'Non-Refundable Situations',
      content: (
        <>
          <p>Refunds will not be issued in the following cases:</p>
          <ul>
            <li>Requests made after 7 days of subscription activation (except for service failure cases above)</li>
            <li>Partial month usage — we do not offer prorated refunds for unused days mid-cycle</li>
            <li>WhatsApp API outages or restrictions imposed by Meta</li>
            <li>Service issues caused by your own internet connectivity or device</li>
            <li>Failure to use the service — simply not logging in does not qualify</li>
            <li>Violations of our Terms of Service that led to account suspension</li>
            <li>Free plan — the Starter plan is free and not subject to refund requests</li>
          </ul>
        </>
      )
    },
    {
      title: 'How to Request a Refund',
      content: (
        <>
          <ol>
            <li>Email us at <strong>support@munshi.pk</strong> with subject line: "Refund Request — [Your Email]"</li>
            <li>Include your registered email address and reason for the refund request</li>
            <li>Our team will review your request within 3 business days</li>
            <li>If approved, refunds are processed within 5–10 business days depending on your payment method</li>
          </ol>
        </>
      )
    },
    {
      title: 'Refund Methods & Timelines',
      content: (
        <ul>
          <li><strong>JazzCash / EasyPaisa:</strong> 2–3 business days to original mobile account</li>
          <li><strong>Bank Transfer (Pakistan):</strong> 3–5 business days</li>
          <li><strong>International Cards:</strong> 5–10 business days depending on your bank</li>
          <li><strong>Dodo Payments (international):</strong> 5–7 business days</li>
        </ul>
      )
    },
    {
      title: 'Plan Pricing Reference',
      content: (
        <ul>
          <li><strong>Starter:</strong> Free — PKR 0 / $0 per month</li>
          <li><strong>Growth:</strong> PKR 7,000 / ~$25 per month</li>
          <li><strong>Pro:</strong> PKR 30,000 / ~$99 per month</li>
        </ul>
      )
    },
    {
      title: 'Cancellation',
      content: (
        <p>
          You can cancel your subscription at any time from the Billing section of your dashboard.
          Cancellation stops future charges — your service remains active until the end of the
          current billing period. Cancellation alone does not trigger a refund unless you are
          within the 7-day window or another eligibility condition applies.
        </p>
      )
    },
    {
      title: 'Contact Us',
      content: (
        <>
          <p>For refund requests or billing questions, reach out to our support team:</p>
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
      title="Refund Policy"
      subtitle="Our commitment to fair and transparent billing."
      effectiveDate="January 1, 2025"
      badge="Legal"
      sections={sections}
    />
  )
}