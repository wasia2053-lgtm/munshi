"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]

const Navbar1 = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <style>{`
        .mn-nav-wrap {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          justify-content: center;
          width: 100%;
          padding: 20px 16px;
          font-family: 'Geist', sans-serif;
          pointer-events: none;
        }
        .mn-nav-pill {
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 10px 12px 10px 16px;
          width: 100%;
          max-width: 760px;
          border-radius: 9999px;
          background: rgba(18,19,20,0.55);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          transition: background 0.3s ease, border-color 0.3s ease;
        }
        .mn-nav-pill.scrolled {
          background: rgba(10,11,12,0.7);
          border-color: rgba(255,255,255,0.1);
        }
        .mn-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .mn-brand-icon {
          display: none;
        }
        .mn-brand-name {
          display: none;
        }
        .mn-nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        @media (max-width: 768px) { .mn-nav-links { display: none; } }
        .mn-nav-link {
          font-size: 13px;
          font-weight: 500;
          color: rgba(196,199,200,0.7);
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 9999px;
          transition: all 0.25s ease;
          white-space: nowrap;
        }
        .mn-nav-link:hover {
          color: #fff;
          background: rgba(255,255,255,0.06);
        }
        .mn-nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        @media (max-width: 768px) { .mn-nav-actions .mn-login { display: none; } }
        .mn-login {
          font-size: 13px;
          font-weight: 500;
          color: #e3e2e2;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 9999px;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .mn-login:hover { color: #4ae176; }
        .mn-cta {
          font-size: 13px;
          font-weight: 700;
          color: #000;
          background: #fff;
          padding: 8px 18px;
          border-radius: 9999px;
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.25s ease;
          display: inline-flex;
        }
        .mn-cta:hover { background: #4ae176; }
        .mn-burger {
          display: none;
          background: none;
          border: none;
          color: #fff;
          padding: 8px;
          border-radius: 9999px;
          cursor: pointer;
          align-items: center;
        }
        @media (max-width: 768px) { .mn-burger { display: flex; } }
        .mn-mobile-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(8,9,10,0.92);
          backdrop-filter: blur(24px);
          display: flex;
          flex-direction: column;
          padding: 100px 32px 40px;
          font-family: 'Geist', sans-serif;
        }
        .mn-mobile-close {
          position: absolute;
          top: 24px; right: 24px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9999px;
          padding: 10px;
          color: #fff;
          cursor: pointer;
          display: flex;
        }
        .mn-mobile-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mn-mobile-link {
          font-size: 22px;
          font-weight: 600;
          color: #fff;
          text-decoration: none;
          letter-spacing: -0.02em;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .mn-mobile-cta-wrap {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mn-mobile-login {
          text-align: center;
          font-size: 15px;
          font-weight: 500;
          color: #e3e2e2;
          padding: 14px;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.1);
          text-decoration: none;
        }
        .mn-mobile-cta {
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          color: #000;
          background: #4ae176;
          padding: 14px;
          border-radius: 9999px;
          text-decoration: none;
        }
      `}</style>

      <div className="mn-nav-wrap">
        <motion.div
          className={`mn-nav-pill ${scrolled ? 'scrolled' : ''}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <BrandLogo variant="full" withTagline={true} withLink={true} height="28px" className="mn-brand" />

          <nav className="mn-nav-links">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} className="mn-nav-link">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mn-nav-actions">
            <Link href="/auth/login" className="mn-login">Login</Link>
            <Link href="/auth/signup" className="mn-cta">Start Free</Link>
            <button className="mn-burger" onClick={toggleMenu} aria-label="Open menu">
              <Menu size={20} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mn-mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{ padding: '0 0 32px 0', display: 'flex', justifyContent: 'center' }}>
              <BrandLogo variant="full" height="32px" />
            </div>
            <button className="mn-mobile-close" onClick={toggleMenu} aria-label="Close menu">
              <X size={20} />
            </button>

            <div className="mn-mobile-links">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  className="mn-mobile-link"
                  onClick={toggleMenu}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  {link.label}
                </motion.a>
              ))}
            </div>

            <div className="mn-mobile-cta-wrap">
              <Link href="/auth/login" className="mn-mobile-login" onClick={toggleMenu}>Login</Link>
              <Link href="/auth/signup" className="mn-mobile-cta" onClick={toggleMenu}>Start Free</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export { Navbar1 }