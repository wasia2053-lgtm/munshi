'use client'

import React, { useEffect, useRef, useState } from 'react'
import { BrandLogo } from "@/components/brand-logo";
const steps = [
  {
    num: '01',
    title: 'Connect WhatsApp',
    body: 'Link your existing WhatsApp Business number in a few clicks. No new number needed.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M21 11.5C21 16.7 16.7 21 11.5 21C9.6 21 7.8 20.5 6.3 19.5L3 21L4.5 17.7C3.5 16.2 3 14.4 3 12.5C3 7.3 7.3 3 12.5 3C17.7 3 21 7.3 21 11.5Z" stroke="#4ae176" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    num: '02',
    title: 'Train on Your Business',
    body: 'Add your website, PDFs, or product info. Munshi learns everything automatically.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#4ae176" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M2 17L12 22L22 17" stroke="#4ae176" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M2 12L12 17L22 12" stroke="#4ae176" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    num: '03',
    title: 'Go Live',
    body: 'Munshi starts replying to customers instantly — in English, Arabic, or Roman Urdu.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="#4ae176" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  },
]

const demoMessages = [
  { from: 'customer', text: 'Hi! Do you deliver to Dubai?' },
  { from: 'bot', text: 'Yes! We deliver to Dubai within 3-5 business days.' },
  { from: 'customer', text: 'How much is the shipping cost?' },
  { from: 'bot', text: 'Shipping to UAE is free for orders above $50. Below that, it\u2019s a flat $8 fee.' },
  { from: 'customer', text: 'Perfect, I\u2019ll order today!' },
]

export default function HowItWorks() {
  const stepsRef = useRef<(HTMLDivElement | null)[]>([])
  const headerRef = useRef<HTMLDivElement>(null)
  const demoSectionRef = useRef<HTMLDivElement>(null)
  const [visibleMessages, setVisibleMessages] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const demoStarted = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
          }
        })
      },
      { threshold: 0.15 }
    )

    stepsRef.current.forEach(el => el && observer.observe(el))
    if (headerRef.current) observer.observe(headerRef.current)

    return () => observer.disconnect()
  }, [])

  // Demo animation - plays once when scrolled into view
  useEffect(() => {
    const demoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !demoStarted.current) {
            demoStarted.current = true
            entry.target.classList.add('in-view')
            runDemoSequence()
          }
        })
      },
      { threshold: 0.3 }
    )

    if (demoSectionRef.current) demoObserver.observe(demoSectionRef.current)
    return () => demoObserver.disconnect()
  }, [])

  const runDemoSequence = () => {
    let index = 0
    const showNext = () => {
      if (index >= demoMessages.length) return

      const msg = demoMessages[index]
      if (msg.from === 'bot') {
        setIsTyping(true)
        setTimeout(() => {
          setIsTyping(false)
          setVisibleMessages(prev => prev + 1)
          index++
          setTimeout(showNext, 900)
        }, 1100)
      } else {
        setVisibleMessages(prev => prev + 1)
        index++
        setTimeout(showNext, 1000)
      }
    }
    setTimeout(showNext, 500)
  }

  return (
    <>
      <style>{`
        .how-root {
          font-family: 'Geist', sans-serif;
          position: relative;
          color: #e3e2e2;
        }
        .how-section {
          position: relative;
          z-index: 10;
          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 40px 100px;
        }
        @media (max-width: 768px) {
          .how-section { padding: 50px 20px 70px; }
        }
        .how-header {
          text-align: center;
          margin-bottom: 64px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .how-header.in-view {
          opacity: 1;
          transform: translateY(0);
        }
        .how-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid rgba(74,225,118,0.25);
          background: rgba(74,225,118,0.05);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #4ae176;
          margin-bottom: 24px;
        }
        .how-title {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin: 0 0 12px;
        }
        .how-sub {
          font-size: 16px;
          color: rgba(196,199,200,0.6);
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.6;
        }
        /* Steps */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 80px;
          position: relative;
        }
        @media (max-width: 900px) {
          .steps-grid { grid-template-columns: 1fr; gap: 16px; }
        }
        .step-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          border-radius: 16px;
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .step-card.in-view {
          opacity: 1;
          transform: translateY(0);
        }
        .step-card:nth-child(1) { transition-delay: 0s; }
        .step-card:nth-child(2) { transition-delay: 0.12s; }
        .step-card:nth-child(3) { transition-delay: 0.24s; }
        .step-card:hover {
          border-color: rgba(74,225,118,0.3);
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.4), 0 0 32px rgba(74,225,118,0.08);
        }
        .step-num {
          font-size: 64px;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: transparent;
          -webkit-text-stroke: 1px rgba(74,225,118,0.18);
          position: absolute;
          top: 8px;
          right: 16px;
          line-height: 1;
          font-family: 'Geist', sans-serif;
          z-index: 0;
          transition: -webkit-text-stroke 0.35s ease, color 0.35s ease;
          pointer-events: none;
        }
        .step-card:hover .step-num {
          -webkit-text-stroke: 1px rgba(74,225,118,0.4);
        }
        .step-card-content {
          position: relative;
          z-index: 1;
        }
        /* Progress line connecting steps */
        .steps-progress-line {
          position: absolute;
          top: 50%;
          left: 6%;
          right: 6%;
          height: 1px;
          background: rgba(255,255,255,0.06);
          z-index: -1;
        }
        .steps-progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #4ae176, transparent);
          transition: width 1.5s ease 0.3s;
        }
        .steps-progress-fill.in-view { width: 100%; }
        @media (max-width: 900px) {
          .steps-progress-line { display: none; }
        }
        .step-icon-wrap {
          width: 52px; height: 52px;
          border-radius: 14px;
          background: rgba(74,225,118,0.08);
          border: 1px solid rgba(74,225,118,0.18);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 22px;
          transition: all 0.35s ease;
        }
        .step-card:hover .step-icon-wrap {
          background: rgba(74,225,118,0.14);
          border-color: rgba(74,225,118,0.35);
          box-shadow: 0 0 24px rgba(74,225,118,0.2);
          transform: scale(1.08);
        }
        .step-title {
          font-size: 19px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          margin: 0 0 10px;
        }
        .step-body {
          font-size: 14px;
          line-height: 1.65;
          color: rgba(196,199,200,0.6);
          margin: 0;
        }
        .step-connector {
          display: none;
          position: absolute;
          top: 50%;
          right: -36px;
          width: 24px;
          height: 1px;
          background: linear-gradient(90deg, rgba(74,225,118,0.3), transparent);
        }
        @media (min-width: 901px) {
          .step-card:not(:last-child) .step-connector { display: block; }
        }

        /* Demo */
        .demo-wrap {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .demo-wrap.in-view {
          opacity: 1;
          transform: translateY(0);
        }
        .demo-card {
          max-width: 480px;
          margin: 0 auto;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 16px 50px rgba(0,0,0,0.4);
          border-radius: 20px;
          overflow: hidden;
        }
        .demo-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
        }
        .demo-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: #4ae176;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: #000;
          flex-shrink: 0;
        }
        .demo-header-text { line-height: 1.3; }
        .demo-header-name { font-size: 14px; font-weight: 700; color: #fff; }
        .demo-header-status {
          font-size: 12px;
          color: #4ae176;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .demo-online-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4ae176;
          animation: how-pulse 2s infinite;
        }
        @keyframes how-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .demo-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 320px;
        }
        .demo-bubble {
          max-width: 80%;
          padding: 10px 14px;
          font-size: 14px;
          line-height: 1.5;
          border-radius: 14px;
          opacity: 0;
          transform: translateY(10px);
          animation: bubble-in 0.4s ease forwards;
        }
        @keyframes bubble-in {
          to { opacity: 1; transform: translateY(0); }
        }
        .demo-bubble.customer {
          align-self: flex-start;
          background: rgba(255,255,255,0.06);
          color: #e3e2e2;
          border-radius: 14px 14px 14px 4px;
        }
        .demo-bubble.bot {
          align-self: flex-end;
          background: rgba(74,225,118,0.12);
          border: 1px solid rgba(74,225,118,0.2);
          color: #e3e2e2;
          border-radius: 14px 14px 4px 14px;
        }
        .demo-typing {
          align-self: flex-end;
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          background: rgba(74,225,118,0.12);
          border: 1px solid rgba(74,225,118,0.2);
          border-radius: 14px 14px 4px 14px;
        }
        .demo-typing-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4ae176;
          animation: typing-bounce 1.2s infinite;
        }
        .demo-typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .demo-typing-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      <div className="how-root" id="how-it-works">
        <div className="how-section">
          {/* Header */}
          <div className="how-header" ref={headerRef}>
            <div className="how-eyebrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="#4ae176" strokeWidth="1.5" strokeLinejoin="round" /></svg>
              How It Works
            </div>
            <h2 className="how-title">Up and Running in Minutes</h2>
            <p className="how-sub">
              Train Munshi on your business once. It answers customers, captures leads, and works around the clock — in multiple languages.
            </p>
          </div>

          {/* Steps */}
          <div className="steps-grid">
            {steps.map((step, i) => (
              <div
                key={i}
                ref={el => { stepsRef.current[i] = el }}
                className="step-card"
              >
                <div className="step-num">{step.num}</div>
                <div className="step-icon-wrap">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-body">{step.body}</p>
                <div className="step-connector" />
              </div>
            ))}
          </div>

          {/* Live demo */}
          <div className="demo-wrap" ref={demoSectionRef}>
            <div className="demo-card">
              <div className="demo-header">
                <BrandLogo variant="full" height="22px" />

                <div className="demo-header-status" style={{ marginLeft: 10 }}>
                  <span className="demo-online-dot" />
                  Online now
                </div>
              </div>
              <div className="demo-body">
                {demoMessages.slice(0, visibleMessages).map((msg, i) => (
                  <div key={i} className={`demo-bubble ${msg.from}`}>
                    {msg.text}
                  </div>
                ))}
                {isTyping && (
                  <div className="demo-typing">
                    <span className="demo-typing-dot" />
                    <span className="demo-typing-dot" />
                    <span className="demo-typing-dot" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}