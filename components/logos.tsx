import React from 'react'
import Link from 'next/link'

export const LogoCompact: React.FC<{ className?: string }> = ({ className }) => (
  <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 0', cursor: 'pointer' }}>
    <span style={{
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '26px',
      fontWeight: '700',
      color: '#d4a853',
      letterSpacing: '3px',
      lineHeight: '1',
      display: 'block',
      textTransform: 'uppercase',
    }}>
      MUNSHI
    </span>
    <span style={{
      fontFamily: "inherit",
      fontSize: '10px',
      fontWeight: '400',
      color: '#c4a882',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      marginTop: '2px',
      display: 'block',
    }}>
      AI WHATSAPP SECRETARY
    </span>
  </Link>
)

export const LogoStacked: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    width="160" 
    height="120" 
    viewBox="0 0 160 120" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="gs1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F0C96A"/>
        <stop offset="100%" stopColor="#C4983F"/>
      </linearGradient>
    </defs>
    {/* Icon centered */}
    <polygon 
      points="80,8 106,8 118,22 118,56 106,70 80,70 54,70 42,56 42,22 54,8" 
      fill="none" 
      stroke="url(#gs1)" 
      strokeWidth="1.8"
    />
    <polygon 
      points="80,15 102,15 112,27 112,51 102,63 80,63 58,63 48,51 48,27 58,15" 
      fill="rgba(212,168,83,0.06)"
    />
    <text 
      x="80" 
      y="57" 
      fontFamily="Cormorant Garamond, serif" 
      fontSize="44" 
      fontWeight="700" 
      fill="url(#gs1)" 
      textAnchor="middle"
    >M</text>
    <circle cx="80" cy="66" r="2" fill="#D4A853" opacity="0.6"/>
    {/* Wordmark centered */}
    <text 
      x="80" 
      y="92" 
      fontFamily="Cormorant Garamond, serif" 
      fontSize="26" 
      fontWeight="700" 
      fill="#F7E7CE" 
      textAnchor="middle" 
      letterSpacing="5"
    >MUNSHI</text>
    {/* Tagline */}
    <text 
      x="80" 
      y="108" 
      fontFamily="DM Sans, sans-serif" 
      fontSize="8" 
      fontWeight="400" 
      fill="#8A7560" 
      textAnchor="middle" 
      letterSpacing="2"
    >AI WHATSAPP SECRETARY</text>
  </svg>
)
