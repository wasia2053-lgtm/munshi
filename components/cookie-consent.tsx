'use client'

import { useEffect, useState } from 'react'
import { Cookie, X } from 'lucide-react'

const CONSENT_KEY = 'munshi_cookie_consent'
const ONE_YEAR = 60 * 60 * 24 * 365

// Persist in BOTH localStorage and a first-party cookie so the choice survives
// storage-blocked browsers and can also be read server-side.
function readChoice(): string | null {
    try {
        const v = localStorage.getItem(CONSENT_KEY)
        if (v) return v
    } catch { }
    const m = document.cookie.match(new RegExp('(?:^|; )' + CONSENT_KEY + '=([^;]*)'))
    return m ? decodeURIComponent(m[1]) : null
}

function writeChoice(choice: 'accepted' | 'declined') {
    try { localStorage.setItem(CONSENT_KEY, choice) } catch { }
    document.cookie = `${CONSENT_KEY}=${choice}; Max-Age=${ONE_YEAR}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
}

export default function CookieConsent() {
    const [visible, setVisible] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (!readChoice()) {
            // slight delay so it slides in after page paints, not jarring on load
            const t = setTimeout(() => setVisible(true), 600)
            return () => clearTimeout(t)
        }
    }, [])

    function handleChoice(choice: 'accepted' | 'declined') {
        writeChoice(choice)
        setVisible(false)
    }

    if (!mounted) return null

    return (
        <div
            role="dialog"
            aria-live="polite"
            aria-hidden={!visible}
            aria-label="Cookie consent"
            style={{
                position: 'fixed',
                left: '16px',
                right: '16px',
                bottom: visible ? '16px' : '-200px',
                zIndex: 9999,
                maxWidth: '560px',
                margin: '0 auto',
                background: '#1a1b1c',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '20px 22px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
                visibility: visible ? 'visible' : 'hidden', // offscreen buttons must not be tabbable
                transition: 'bottom 0.4s cubic-bezier(0.4,0,0.2,1), visibility 0.4s',
                boxSizing: 'border-box',
            }}
        >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(74,225,118,0.1)',
                        border: '1px solid rgba(74,225,118,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Cookie size={16} color="#4ae176" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, margin: '0 0 4px' }}>
                        We use cookies
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '12.5px', lineHeight: 1.5, margin: 0 }}>
                        We use essential cookies to run Munshi, and optional ones to understand how you use the product.{' '}
                        <a
                            href="/privacy-policy"
                            style={{ color: '#4ae176', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                        >
                            Read our Privacy Policy
                        </a>
                        .
                    </p>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                        <button
                            onClick={() => handleChoice('accepted')}
                            style={{
                                padding: '9px 18px',
                                borderRadius: '10px',
                                fontSize: '12.5px',
                                fontWeight: 700,
                                background: '#4ae176',
                                color: '#0b0c0c',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => handleChoice('declined')}
                            style={{
                                padding: '9px 18px',
                                borderRadius: '10px',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                background: 'rgba(255,255,255,0.04)',
                                color: '#9ca3af',
                                border: '1px solid rgba(255,255,255,0.08)',
                                cursor: 'pointer',
                            }}
                        >
                            Decline
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => handleChoice('declined')}
                    aria-label="Dismiss"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#4b5563',
                        cursor: 'pointer',
                        padding: '2px',
                        flexShrink: 0,
                    }}
                >
                    <X size={15} />
                </button>
            </div>
        </div>
    )
}