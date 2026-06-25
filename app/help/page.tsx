'use client'
import { AppShell } from '@/components/app-shell'
import { motion } from 'framer-motion'
import { MessageCircle, Phone } from 'lucide-react'

const faqs = [
    {
        q: 'Why is my bot not replying?',
        a: 'Check: (1) Is WhatsApp connected? (2) Have you hit your message limit? (3) Check your Operating Hours in Settings.',
    },
    {
        q: 'How do I train my bot?',
        a: 'Go to Training Center → Add your website URL, upload a PDF, or paste text → Click Train. Your bot learns automatically.',
    },
    {
        q: 'How do I change the bot language?',
        a: 'Go to Settings → Bot Personality → Select your language under "Bot Reply Language" → Save.',
    },
    {
        q: 'My message limit is full — what now?',
        a: 'Check your usage on the Account page. To upgrade, go to Billing and click "Contact us to Upgrade".',
    },
    {
        q: 'How do I connect my WhatsApp number?',
        a: 'Go to the WhatsApp page → Select "Let us connect it for you" → Fill the form. Our team will reach out within 24 hours.',
    },
    {
        q: 'How do I change my bot name?',
        a: 'Go to Settings → Bot Personality → Update the Bot Name field → Click Save Bot Settings.',
    },
    {
        q: 'Does the bot work in Arabic and English?',
        a: 'Yes. The bot auto-detects the customer\'s language and replies accordingly, regardless of your default setting.',
    },
]

export default function HelpPage() {
    const card: React.CSSProperties = {
        backgroundColor: '#1a1b1c',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px',
    }

    return (
        <AppShell>
            <div style={{ width: '100%', fontFamily: 'Geist, sans-serif' }}>

                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 600 }}>Help Center</h1>
                    <p style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>Questions? We're here to help.</p>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
                    {[
                        { icon: <MessageCircle size={20} color="#4ae176" />, title: 'WhatsApp Support', desc: 'Message us directly', action: () => window.open('https://wa.me/923282847607', '_blank') },
                        { icon: <Phone size={20} color="#4ae176" />, title: 'Contact Us', desc: 'Upgrade or report an issue', action: () => window.open('https://wa.me/923282847607', '_blank') },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            onClick={item.action}
                            style={{ ...card, cursor: 'pointer', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '16px' }}
                        >
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                backgroundColor: 'rgba(74,225,118,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                {item.icon}
                            </div>
                            <div>
                                <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{item.title}</div>
                                <div style={{ color: '#888', fontSize: '13px' }}>{item.desc}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Frequently Asked Questions</h2>

                {faqs.map((faq, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} style={card}>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{faq.q}</div>
                        <div style={{ color: '#888', fontSize: '13px', lineHeight: '1.6' }}>{faq.a}</div>
                    </motion.div>
                ))}

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    style={{ ...card, backgroundColor: 'rgba(74,225,118,0.05)', border: '1px solid rgba(74,225,118,0.15)', textAlign: 'center' }}
                >
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>Still need help?</div>
                    <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>Message us on WhatsApp — we reply fast.</p>
                    <button
                        onClick={() => window.open('https://wa.me/923282847607', '_blank')}
                        style={{ backgroundColor: '#4ae176', color: '#121314', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'Geist, sans-serif' }}
                    >
                        Chat with us on WhatsApp
                    </button>
                </motion.div>
            </div>
        </AppShell>
    )
}