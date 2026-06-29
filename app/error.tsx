'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[Dashboard Error]', error)
    }, [error])

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#121314',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                textAlign: 'center',
            }}
        >
            <div
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                }}
            >
                <AlertTriangle size={24} color="#ef4444" />
            </div>

            <h2
                style={{
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: 700,
                    margin: '0 0 8px',
                    letterSpacing: '-0.3px',
                }}
            >
                Something went wrong
            </h2>

            <p
                style={{
                    color: '#6b7280',
                    fontSize: '14px',
                    margin: '0 0 28px',
                    maxWidth: '380px',
                    lineHeight: 1.5,
                }}
            >
                This page hit an unexpected error. Try again, or head back to the overview if it keeps happening.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={reset}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '11px 20px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        background: '#4ae176',
                        color: '#0b0c0c',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    <RotateCcw size={14} /> Try again
                </button>

                <a
                    href="/dashboard"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '11px 20px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        background: 'rgba(255,255,255,0.04)',
                        color: '#9ca3af',
                        border: '1px solid rgba(255,255,255,0.08)',
                        textDecoration: 'none',
                    }}
                >
                    Back to Overview
                </a>
            </div>
        </div>
    )
}