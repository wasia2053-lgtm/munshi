'use client'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px',
      textAlign: 'center',
      minHeight: '300px'
    }}>
      {/* Icon */}
      <div style={{
        fontSize: '48px',
        marginBottom: '16px'
      }}>
        {icon}
      </div>

      {/* Title */}
      <h2 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#F7E7CE',
        marginBottom: '8px',
        margin: '0 0 8px 0'
      }}>
        {title}
      </h2>

      {/* Description */}
      <p style={{
        fontSize: '14px',
        color: '#8A7560',
        marginBottom: '24px',
        lineHeight: '1.5',
        maxWidth: '400px'
      }}>
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && (
        <button
          onClick={onAction}
          style={{
            backgroundColor: '#D4A853',
            color: '#102C26',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0C96A'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D4A853'}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
