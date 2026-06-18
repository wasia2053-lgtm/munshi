"use client";
import { useState } from 'react';

const faqs = [
  {
    q: "Do I need a Meta Business account to use Munshi?",
    a: "Yes. You'll need a WhatsApp Business API account via Meta. We walk you through the entire setup during onboarding — it takes about 5 minutes."
  },
  {
    q: "What happens when I hit my message limit?",
    a: "Your bot pauses until the next billing cycle. You can upgrade anytime to instantly restore service. We send a notification before you hit the limit."
  },
  {
    q: "Can the bot reply in Roman Urdu?",
    a: "Yes — Munshi is the only WhatsApp AI that natively supports Roman Urdu. It also auto-detects the customer's language and switches mid-conversation."
  },
  {
    q: "How does the AI learn my business?",
    a: "You can train it three ways: paste your website URL (we scrape up to 20 pages), upload PDFs (menus, brochures, pricing), or type information manually. The bot answers based only on what you've trained it on."
  },
  {
    q: "Is my customer data safe?",
    a: "All data is stored on Supabase with row-level security. We never sell or share your customer data. You own it entirely."
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no cancellation fees. Downgrade or cancel from your billing page at any time."
  },
  {
    q: "What languages does the bot support?",
    a: "English (UK & US), Roman Urdu, and Arabic. The bot auto-detects the customer's language and responds accordingly."
  },
  {
    q: "Do you offer a free trial?",
    a: "Yes — our Starter plan is permanently free with 50 messages/month. No credit card required."
  }
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" style={{ padding: '120px 24px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <p style={{ color: '#4ae176', fontSize: '13px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
          FAQ
        </p>
        <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
          Questions you probably have
        </h2>
      </div>

      {/* Accordion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {faqs.map((faq, i) => (
          <div
            key={i}
            role="button"
            tabIndex={0}
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpen(open === i ? null : i);
              }
            }}
            style={{
              background: open === i ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${open === i ? 'rgba(74,225,118,0.25)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '12px',
              padding: '20px 24px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#fff', fontSize: '15px', fontWeight: 500, lineHeight: 1.4 }}>{faq.q}</span>
              <span style={{
                color: '#4ae176',
                fontSize: '20px',
                fontWeight: 300,
                flexShrink: 0,
                transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}>+</span>
            </div>
            {open === i && (
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: 1.7, marginTop: '12px', marginBottom: 0 }}>
                {faq.a}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
