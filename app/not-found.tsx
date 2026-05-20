import Link from 'next/link'

export const metadata = {
  title: '404 - Page Nahi Mili | Munshi',
}

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#102C26',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        
        {/* Logo */}
        <h1 style={{ 
          color: '#D4A853', 
          fontSize: '2rem', 
          fontWeight: 'bold',
          letterSpacing: '4px',
          marginBottom: '4px'
        }}>
          MUNSHI
        </h1>
        <p style={{ color: '#F7E7CE', fontSize: '12px', marginTop: 0 }}>
          AI WhatsApp Secretary
        </p>

        {/* 404 */}
        <div style={{
          fontSize: '8rem',
          fontWeight: 'bold',
          color: '#D4A853',
          lineHeight: 1,
          margin: '32px 0 16px'
        }}>
          404
        </div>

        {/* Message */}
        <h2 style={{ color: '#F7E7CE', fontSize: '1.5rem', marginBottom: '12px' }}>
          Yeh Page Nahi Mili! 🔍
        </h2>
        <p style={{ color: '#8A7560', marginBottom: '32px', lineHeight: 1.6 }}>
          Lagta hai aap galat jagah aa gaye hain. 
          Koi baat nahi — wapas chalte hain!
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{
            background: '#D4A853',
            color: '#0a1f1b',
            padding: '12px 28px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '15px'
          }}>
            Dashboard pe Jao
          </Link>
          <Link href="/" style={{
            border: '1px solid #2A4A42',
            color: '#F7E7CE',
            padding: '12px 28px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '15px'
          }}>
            Home
          </Link>
        </div>

      </div>
    </div>
  )
}