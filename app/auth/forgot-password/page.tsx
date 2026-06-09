'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl')
    if (!gl) return

    const vs = `attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}`
    const fs = `precision highp float;uniform float t;uniform vec2 r;void main(){vec2 uv=gl_FragCoord.xy/r;float n=fract(sin(dot(uv,vec2(12.9,78.2)))*43758.5);vec3 c=vec3(0.05,0.055,0.06)+vec3(0,0.08,0.04)*(1.-length(uv-0.5))*(sin(t*0.5)*.5+.5);gl_FragColor=vec4(c,1);}`

    function createShader(type: number, source: string) {
      const s = gl!.createShader(type)!
      gl!.shaderSource(s, source)
      gl!.compileShader(s)
      return s
    }

    const program = gl.createProgram()!
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, vs))
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(program)
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const p = gl.getAttribLocation(program, 'p')
    gl.enableVertexAttribArray(p)
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0)

    const ut = gl.getUniformLocation(program, 't')
    const ur = gl.getUniformLocation(program, 'r')

    let animId: number
    function render(time: number) {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
      gl!.viewport(0, 0, canvas!.width, canvas!.height)
      gl!.uniform1f(ut, time * 0.001)
      gl!.uniform2f(ur, canvas!.width, canvas!.height)
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
      animId = requestAnimationFrame(render)
    }
    render(0)
    return () => cancelAnimationFrame(animId)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      if (error) setError(error.message)
      else setSent(true)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .fp-root {
          font-family: 'Geist', 'Inter', sans-serif;
          background: #000000;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          color: #e3e2e2;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 0 20px;
        }
        .shader-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0.6;
          pointer-events: none;
          z-index: 0;
        }
        .glass-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(32px);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.8);
          border-radius: 12px;
          padding: 32px 28px;
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 10;
        }
        .brand-icon {
          width: 32px; height: 32px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: #4ae176;
          margin: 0 auto 16px;
        }
        .card-title {
          font-size: clamp(20px, 3vw, 26px);
          font-weight: 600;
          color: #ffffff;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 6px;
          text-align: center;
        }
        .card-sub {
          font-size: 13px;
          color: rgba(196,199,200,0.7);
          text-align: center;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(196,199,200,0.7);
          margin-bottom: 8px;
        }
        .input-wrap { position: relative; }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(196,199,200,0.35);
          pointer-events: none;
        }
        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 11px 14px 11px 42px;
          font-family: inherit;
          font-size: 14px;
          color: #e3e2e2;
          transition: all 0.3s ease;
        }
        .input-field::placeholder { color: rgba(196,199,200,0.3); }
        .input-field:focus {
          outline: none;
          border-color: rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.06);
        }
        .btn-primary {
          width: 100%;
          height: 44px;
          background: #ffffff;
          color: #000000;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 20px;
        }
        .btn-primary:hover { background: rgba(255,255,255,0.9); box-shadow: 0 0 20px rgba(255,255,255,0.1); }
        .btn-primary:active { transform: scale(0.98); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .error-box {
          margin-bottom: 14px;
          padding: 10px 12px;
          background: rgba(255,180,171,0.08);
          border: 1px solid rgba(255,180,171,0.2);
          border-radius: 8px;
          color: #ffb4ab;
          font-size: 13px;
        }
        .back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 13px;
          color: rgba(196,199,200,0.6);
          text-decoration: none;
          transition: color 0.2s;
        }
        .back-link:hover { color: #ffffff; }
        .success-icon {
          width: 52px; height: 52px;
          background: rgba(74,225,118,0.1);
          border: 1px solid rgba(74,225,118,0.2);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
        }
      `}</style>

      <div className="fp-root">
        <canvas ref={canvasRef} className="shader-bg" />

        <div className="glass-card">
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div className="success-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 6L12 13L2 6" stroke="#4ae176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="card-title">Check your email</h2>
              <p className="card-sub">Recovery link sent to<br /><span style={{ color: '#4ae176' }}>{email}</span></p>
              <Link href="/auth/login" className="back-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="brand-icon">M</div>
              <h1 className="card-title">Recover Access</h1>
              <p className="card-sub">Enter your verified email to initialize the secure recovery sequence.</p>

              {error && <div className="error-box">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div>
                  <label className="field-label">Verified Email</label>
                  <div className="input-wrap">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="input-field"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Initialize Recovery'}
                </button>
              </form>

              <Link href="/auth/login" className="back-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Return to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}