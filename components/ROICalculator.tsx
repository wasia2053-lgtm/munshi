"use client"
import { useState } from 'react'

export default function ROICalculator() {
  const [msgs, setMsgs] = useState(200)
  const [rate, setRate] = useState(30)
  const [avg, setAvg] = useState(5000)

  const leads = Math.round(msgs * (rate / 100))
  const revenue = leads * avg
  const cost = 7000
  const roi = Math.round(((revenue - cost) / cost) * 100)

  const fmt = (n: number) =>
    n >= 100000
      ? `PKR ${(n / 1000).toFixed(0)}K`
      : `PKR ${n.toLocaleString()}`

  return (
    <section id="roi" style={{ padding: '120px 24px', maxWidth: '760px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <p style={{ color: '#4ae176', fontSize: '13px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
          ROI Calculator
        </p>
        <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
          What does a missed message actually cost?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '16px', marginTop: '16px' }}>
          Adjust the numbers to your business. See the math.
        </p>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: 'clamp(32px, 4vw, 56px)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '48px'
      }}>
        {/* Left: Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          <Slider
            label="WhatsApp messages / month"
            value={msgs}
            min={50}
            max={2000}
            step={50}
            display={`${msgs}`}
            onChange={setMsgs}
          />
          <Slider
            label="% that are buying inquiries"
            value={rate}
            min={5}
            max={80}
            step={5}
            display={`${rate}%`}
            onChange={setRate}
          />
          <Slider
            label="Average order value (PKR)"
            value={avg}
            min={500}
            max={50000}
            step={500}
            display={`PKR ${avg.toLocaleString()}`}
            onChange={setAvg}
          />
        </div>

        {/* Right: Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
          <ResultCard label="Potential leads / month" value={`${leads}`} />
          <ResultCard label="Potential revenue / month" value={fmt(revenue)} highlight />
          <ResultCard label="Munshi Growth plan cost" value="PKR 7,000" dim />
          <div style={{
            background: roi > 0 ? 'rgba(74,225,118,0.08)' : 'rgba(255,80,80,0.08)',
            border: `1px solid ${roi > 0 ? 'rgba(74,225,118,0.2)' : 'rgba(255,80,80,0.2)'}`,
            borderRadius: '12px',
            padding: '16px 20px',
            textAlign: 'center'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              Return on Investment
            </p>
            <p style={{ color: roi > 0 ? '#4ae176' : '#ff6b6b', fontSize: '32px', fontWeight: 700, margin: 0 }}>
              {roi > 0 ? '+' : ''}{roi.toLocaleString()}%
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: stack */}
      <style>{`
        @media (max-width: 600px) {
          #roi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

function Slider({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number; display: string;
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>{label}</span>
        <span style={{ color: '#4ae176', fontSize: '13px', fontWeight: 600 }}>{display}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#4ae176', cursor: 'pointer' }}
      />
    </div>
  )
}

function ResultCard({ label, value, highlight, dim }: {
  label: string; value: string; highlight?: boolean; dim?: boolean
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '10px',
      padding: '14px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{label}</span>
      <span style={{
        color: dim ? 'rgba(255,255,255,0.3)' : highlight ? '#fff' : '#fff',
        fontSize: highlight ? '18px' : '15px',
        fontWeight: highlight ? 700 : 500
      }}>{value}</span>
    </div>
  )
}
