'use client'

interface SkeletonLineProps {
  width?: 'full' | '3/4' | '1/2'
  height?: string
}

interface SkeletonCardProps {
  lines?: number
}

interface SkeletonTableProps {
  rows?: number
  cols?: number
}

export function SkeletonLine({ width = 'full', height = '16px' }: SkeletonLineProps) {
  const getWidth = () => {
    switch (width) {
      case 'full':
        return '100%'
      case '3/4':
        return '75%'
      case '1/2':
        return '50%'
      default:
        return '100%'
    }
  }

  return (
    <div style={{
      width: getWidth(),
      height: height,
      backgroundColor: '#1A3D35',
      borderRadius: '4px',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export function SkeletonCard({ lines = 3 }: SkeletonCardProps) {
  return (
    <div style={{
      backgroundColor: '#0D2420',
      border: '1px solid #2A4A42',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px'
    }}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} style={{ marginBottom: index < lines - 1 ? '8px' : '0' }}>
          <SkeletonLine width={index === 0 ? 'full' : '3/4'} height="12px" />
          <SkeletonLine width="1/2" height="8px" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: SkeletonTableProps) {
  return (
    <div style={{
      backgroundColor: '#0D2420',
      border: '1px solid #2A4A42',
      borderRadius: '8px',
      padding: '16px',
      overflow: 'hidden'
    }}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', gap: '16px', marginBottom: rowIndex < rows - 1 ? '12px' : '0' }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div key={colIndex} style={{ flex: 1 }}>
              <SkeletonLine width="full" height="16px" />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <SkeletonLine width="3/4" height="12px" />
                <SkeletonLine width="1/2" height="12px" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default { SkeletonLine, SkeletonCard, SkeletonTable }
