import React from 'react'
import Link from 'next/link'

/**
 * LogoCompact — compact brand mark with link to home.
 * Uses the official logo.svg asset.
 */
export const LogoCompact: React.FC<{ className?: string }> = ({ className }) => (
  <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
    <img
      src="/branding/logo.svg"
      alt="Munshi"
      className={className}
      style={{ display: 'block', height: '34px', width: 'auto' }}
    />
  </Link>
)

/**
 * LogoStacked — stacked version (icon + wordmark), used for splash screens etc.
 * Uses the official icon.svg + logo.svg assets.
 */
export const LogoStacked: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={className}
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
  >
    <img
      src="/branding/icon.svg"
      alt="Munshi icon"
      width={64}
      height={64}
      style={{ display: 'block' }}
    />
    <img
      src="/branding/logo.svg"
      alt="Munshi"
      style={{ display: 'block', height: '34px', width: 'auto' }}
    />
  </div>
)
