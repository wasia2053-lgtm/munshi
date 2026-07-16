import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div style={{
      width: 32, height: 32,
      background: '#121314',
      borderRadius: 7,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      <span style={{
        fontFamily: 'sans-serif',
        fontSize: 20,
        fontWeight: 700,
        color: '#ffffff',
        letterSpacing: '-0.04em',
      }}>m</span>
      <div style={{
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: '#4ae176',
      }} />
    </div>
  )
}
