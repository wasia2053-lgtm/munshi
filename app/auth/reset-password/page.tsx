'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl')
    if (!gl) return

    const vs = `attribute vec2 a_position;varying vec2 v_texCoord;void main(){v_texCoord=a_position*0.5+0.5;gl_Position=vec4(a_position,0.0,1.0);}`
    const fs = `precision highp float;uniform float u_time;uniform vec2 u_resolution;varying vec2 v_texCoord;float noise(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){vec2 uv=v_texCoord;vec3 color=vec3(0.07,0.075,0.08);float dist=length(uv-vec2(0.5,0.5));color+=vec3(0.0,0.1,0.05)*(1.0-smoothstep(0.0,1.2,dist));for(float i=0.0;i<40.0;i++){vec2 pos=vec2(noise(vec2(i,1.0)),noise(vec2(i,2.0)));pos.y=fract(pos.y+u_time*0.02*(0.5+noise(vec2(i,3.0))));float size=0.001+0.001*noise(vec2(i,4.0));float spark=smoothstep(size,0.0,length(uv-pos));color+=vec3(0.29,0.88,0.46)*spark*(0.3+0.7*sin(u_time+i));}gl_FragColor=vec4(color,1.0);}`

    function cs(type: number, src: string) {
      const s = gl!.createShader(type)!
      gl!.shaderSource(s, src)
      gl!.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs))
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(prog)
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes = gl.getUniformLocation(prog, 'u_resolution')

    function syncSize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    window.addEventListener('resize', syncSize)
    syncSize()

    let animId: number
    function render(t: number) {
      gl!.viewport(0, 0, canvas!.width, canvas!.height)
      gl!.uniform1f(uTime, t * 0.001)
      gl!.uniform2f(uRes, canvas!.width, canvas!.height)
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
      animId = requestAnimationFrame(render)
    }
    render(0)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', syncSize) }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) setError(error.message)
      else { setDone(true); setTimeout(() => router.push('/auth/login'), 2500) }
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
        .rp-root {
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
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }
        .glass-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.8);
          border-radius: 12px;
          padding: 32px 28px;
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 10;
        }
        .glass-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          pointer-events: none;
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
          margin-bottom: 6px;
          text-align: center;
        }
        .card-sub {
          font-size: 13px;
          color: rgba(196,199,200,0.65);
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
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 11px 42px;
          font-family: inherit;
          font-size: 14px;
          color: #e3e2e2;
          transition: all 0.3s ease;
        }
        .input-field::placeholder { color: rgba(196,199,200,0.3); }
        .input-field:focus {
          outline: none;
          border-color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 15px rgba(255,255,255,0.03);
        }
        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(196,199,200,0.4);
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: #e3e2e2; }
        .form-stack { display: flex; flex-direction: column; gap: 16px; }
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
        }
        .btn-primary:hover { box-shadow: 0 0 20px rgba(255,255,255,0.2); transform: translateY(-1px); }
        .btn-primary:active { transform: scale(0.98); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
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
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
          font-size: 13px;
          color: rgba(196,199,200,0.6);
          text-decoration: none;
          transition: color 0.2s;
        }
        .back-link:hover { color: #ffffff; }
        .encrypt-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 16px;
          opacity: 0.3;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .success-circle {
          width: 52px; height: 52px;
          background: rgba(74,225,118,0.1);
          border: 1px solid rgba(74,225,118,0.2);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
        }
      `}</style>

      <div className="rp-root">
        <canvas ref={canvasRef} className="shader-bg" />

        <div className="glass-card">
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div className="success-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="#4ae176" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="card-title">Password Updated</h2>
              <p className="card-sub">Redirecting to login...</p>
            </div>
          ) : (
            <>
              <div className="brand-icon">M</div>
              <h1 className="card-title">Set New Credentials</h1>
              <p className="card-sub">Update your security tokens to regain control of your account.</p>

              {error && <div className="error-box">{error}</div>}

              <form onSubmit={handleSubmit} className="form-stack">
                <div>
                  <label className="field-label">New Security Token</label>
                  <div className="input-wrap">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="input-field"
                      required
                      minLength={6}
                    />
                    <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /></svg>
                      }
                    </button>
                  </div>
                </div>

                <div>
                  <label className="field-label">Confirm Token</label>
                  <div className="input-wrap">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="input-field"
                      required
                      minLength={6}
                    />
                    <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /></svg>
                      }
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : <>Complete Reset <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></>}
                </button>
              </form>

              <Link href="/auth/login" className="back-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Back to Login
              </Link>

              <div className="encrypt-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                End-to-End Encryption Enabled
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}