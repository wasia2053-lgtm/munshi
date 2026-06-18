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

  const fmt = (n: number) => {
    if (n >= 1000000) return `PKR ${(n / 1000000).toFixed(1)}M`
    if (n >= 100000) return `PKR ${(n / 1000).toFixed(0)}K`
    return `PKR ${n.toLocaleString()}`
  }

  return (
    <section id="roi" style={{
      padding: '120px 24px',
      maxWidth: '760px',
      margin: '0 auto',
      fontFamily: 'inherit'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <p style={{
          color: '#4ae176',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '12px',
          fontFamily: 'inherit'
        }}>
          ROI Calculator
        </p>
        <h2 style={{
          color: '#fff',
          fontSize: 'clamp(26px, 4vw, 42px)',
          fontWeight: 700,
          lineHeight: 1.2,
          margin: '0 0 16px',
          fontFamily: 'inherit'
        }}>
          What does a missed message actually cost?
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: '16px',
          margin: 0,
          fontFamily: 'inherit'
        }}>
          Adjust the numbers to your business. See the math.
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: 'clamp(28px, 4vw, 52px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px'
      }}>
        {/* Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <SliderRow
            label="WhatsApp messages / month"
            value={msgs}
            min={50} max={2000} step={50}
            display={`${msgs}`}
            onChange={setMsgs}
          />
          <SliderRow
            label="% that are buying inquiries"
            value={rate}
            min={5} max={80} step={5}
            display={`${rate}%`}
            onChange={setRate}
          />
          <SliderRow
            label="Average order value (PKR)"
            value={avg}
            min={500} max={50000} step={500}
            display={`PKR ${avg.toLocaleString()}`}
            onChange={setAvg}
          />
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

        {/* Results — responsive grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <ResultCard label="Potential leads / month" value={`${leads}`} />
          <ResultCard label="Potential revenue" value={fmt(revenue)} highlight />
          <ResultCard label="Munshi Growth plan" value="PKR 7,000" dim />
          <div style={{
            background: roi > 0 ? 'rgba(74,225,118,0.08)' : 'rgba(255,80,80,0.08)',
            border: `1px solid ${roi > 0 ? 'rgba(74,225,118,0.2)' : 'rgba(255,80,80,0.2)'}`,
            borderRadius: '12px',
            padding: '16px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <p style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 6px',
              fontFamily: 'inherit'
            }}>
              ROI
            </p>
            <p style={{
              color: roi > 0 ? '#4ae176' : '#ff6b6b',
              fontSize: 'clamp(22px, 4vw, 32px)',
              fontWeight: 700,
              margin: 0,
              fontFamily: 'inherit'
            }}>
              {roi > 0 ? '+' : ''}{roi > 9999 ? `${(roi/1000).toFixed(0)}K` : roi.toLocaleString()}%
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function SliderRow({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (v: number) => void
}) {
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '10px',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', fontFamily: 'inherit' }}>
          {label}
        </span>
        <span style={{ color: '#4ae176', fontSize: '14px', fontWeight: 600, fontFamily: 'inherit', flexShrink: 0 }}>
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#4ae176', cursor: 'pointer', display: 'block' }}
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
      borderRadius: '12px',
      padding: '16px 18px'
    }}>
      <p style={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: '12px',
        margin: '0 0 6px',
        fontFamily: 'inherit'
      }}>{label}</p>
      <p style={{
        color: dim ? 'rgba(255,255,255,0.3)' : '#fff',
        fontSize: highlight ? '20px' : '16px',
        fontWeight: highlight ? 700 : 500,
        margin: 0,
        fontFamily: 'inherit'
      }}>{value}</p>
    </div>
  )
}
