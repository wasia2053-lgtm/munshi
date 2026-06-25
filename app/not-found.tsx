'use client'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#121314',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Geist, sans-serif', textAlign: 'center', padding: '24px',
    }}>
      <div style={{ fontSize: '80px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>404</div>
      <div style={{ fontSize: '24px', fontWeight: 600, color: '#fff', margin: '16px 0 8px' }}>Page not found</div>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px' }}>
        Galat jagah aa gaye — koi baat nahi, wapas chalte hain.
      </p>
      <Link href="/dashboard" style={{
        backgroundColor: '#4ae176', color: '#121314',
        padding: '10px 28px', borderRadius: '8px',
        fontWeight: 600, fontSize: '14px', textDecoration: 'none',
      }}>
        Dashboard pe Jao
      </Link>
    </div>
  )
}