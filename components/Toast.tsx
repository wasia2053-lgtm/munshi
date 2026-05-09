'use client'
import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF82'
      case 'error':
        return '#EF4444'
      case 'info':
        return '#D4A853'
      default:
        return '#2A4A42'
    }
  }

  const getPosition = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) {
        return {
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)'
        }
      }
    }
    return {
      bottom: '20px',
      right: '20px'
    }
  }

  return (
    <div style={{
      position: 'fixed',
      zIndex: 9999,
      backgroundColor: getBackgroundColor(),
      color: 'white',
      borderRadius: '8px',
      padding: '12px 16px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '300px',
      maxWidth: '400px',
      opacity: 0,
      animation: 'fadeIn 0.3s ease-in-out forwards',
      ...getPosition()
    }}>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      <span style={{ flex: 1 }}>
        {message}
      </span>
      
      <button
        onClick={onClose}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '0',
          lineHeight: '1',
          opacity: 0.8,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
      >
        ×
      </button>
    </div>
  )
}
