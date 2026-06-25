'use client'
import { AppShell } from '@/components/app-shell'
import { motion } from 'framer-motion'
import { MessageCircle, Book, Zap, Phone } from 'lucide-react'

const faqs = [
    {
        q: 'Bot reply kyun nahi kar raha?',
        a: 'Check karo: (1) WhatsApp connected hai? (2) Message limit khatam to nahi? (3) Operating hours check karo Settings mein.',
    },
    {
        q: 'Training kaise karte hain?',
        a: 'Training Center mein jao → Website URL, PDF, ya text paste karo → Train karo. Bot automatically learn kar leta hai.',
    },
    {
        q: 'Language change kaise karein?',
        a: 'Settings → Bot Personality → Bot Reply Language mein se apni language select karo aur Save karo.',
    },
    {
        q: 'Message limit khatam ho gayi?',
        a: 'Account page pe usage dekho. Upgrade ke liye Billing page pe "Contact us to Upgrade" click karo.',
    },
    {
        q: 'WhatsApp number kaise connect karein?',
        a: 'WhatsApp page pe jao → "Let us connect it for you" select karo → Form bharo. Team 24 hours mein contact karegi.',
    },
    {
        q: 'Bot ka naam kaise change karein?',
        a: 'Settings → Bot Personality → Bot Name field mein naam daalo → Save Bot Settings.',
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

                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 600 }}>Help Center</h1>
                    <p style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>Sawal? Hum yahan hain.</p>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
                    {[
                        { icon: <MessageCircle size={20} color="#4ae176" />, title: 'WhatsApp Support', desc: 'Direct message karein', action: () => window.open('https://wa.me/923282847607', '_blank') },
                        { icon: <Phone size={20} color="#4ae176" />, title: 'Contact Us', desc: 'Upgrade ya koi masla', action: () => window.open('https://wa.me/923282847607', '_blank') },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            onClick={item.action}
                            style={{
                                ...card,
                                cursor: 'pointer',
                                marginBottom: 0,
                                display: 'flex', alignItems: 'center', gap: '16px',
                            }}
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

                {/* FAQ */}
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                    Aksar Pooche Jane Wale Sawal
                </h2>

                {faqs.map((faq, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        style={card}
                    >
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>
                            {faq.q}
                        </div>
                        <div style={{ color: '#888', fontSize: '13px', lineHeight: '1.6' }}>
                            {faq.a}
                        </div>
                    </motion.div>
                ))}

                {/* Still need help */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{
                        ...card,
                        backgroundColor: 'rgba(74,225,118,0.05)',
                        border: '1px solid rgba(74,225,118,0.15)',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>Aur madad chahiye?</div>
                    <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>
                        WhatsApp pe directly message karein — hum jaldi reply karenge.
                    </p>
                    <button
                        onClick={() => window.open('https://wa.me/923282847607', '_blank')}
                        style={{
                            backgroundColor: '#4ae176', color: '#121314',
                            border: 'none', borderRadius: '8px',
                            padding: '10px 24px', fontWeight: 600,
                            fontSize: '13px', cursor: 'pointer',
                            fontFamily: 'Geist, sans-serif',
                        }}
                    >
                        WhatsApp pe Contact Karein
                    </button>
                </motion.div>
            </div>
        </AppShell>
    )
}