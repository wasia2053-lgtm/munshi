'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogoCompact } from './logos'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

const navItems = [
  { href: '/dashboard',               icon: '🏠', label: 'Dashboard' },
  { href: '/dashboard/whatsapp',      icon: '📱', label: 'WhatsApp' },
  { href: '/dashboard/training',      icon: '🧠', label: 'Train Bot' },
  { href: '/dashboard/conversations', icon: '💬', label: 'Conversations', badge: '5' },
  { href: '/dashboard/analytics',     icon: '📊', label: 'Analytics' },
  { href: '/dashboard/settings',      icon: '⚙️', label: 'Settings' },
]

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser]           = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* ── Auth ── */
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      setLoading(false)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') router.push('/login')
        else if (session) setUser(session.user)
      }
    )
    return () => subscription.unsubscribe()
  }, [router])

  /* close sidebar on route change */
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  /* close sidebar on wide screen resize */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setSidebarOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname?.startsWith(href)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#102C26', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#F7E7CE', fontFamily: 'DM Sans, sans-serif' }}>Loading...</div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        /* ── RESET ── */
        *, *::before, *::after { box-sizing: border-box; }

        /* ── LAYOUT SHELL ── */
        .dl-shell {
          display: flex;
          min-height: 100vh;
          background: #102C26;
          overflow-x: hidden;
        }

        /* ── OVERLAY ── */
        .dl-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 40;
        }
        .dl-overlay.open { display: block; }

        /* ── SIDEBAR ── */
        .dl-sidebar {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: 240px;
          background: #0D2420;
          border-right: 1px solid #2A4A42;
          display: flex;
          flex-direction: column;
          z-index: 50;
          transition: transform 0.28s ease;
          will-change: transform;
        }

        /* Desktop: always visible */
        @media (min-width: 1024px) {
          .dl-sidebar { transform: translateX(0) !important; }
        }

        /* Mobile: hidden by default, shown when open */
        @media (max-width: 1023px) {
          .dl-sidebar { transform: translateX(-100%); }
          .dl-sidebar.open { transform: translateX(0); }
        }

        /* ── SIDEBAR HEADER ── */
        .dl-sidebar-header {
          padding: 20px 16px;
          border-bottom: 1px solid #2A4A42;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 64px;
        }
        .dl-close-btn {
          display: none;
          background: none;
          border: none;
          color: #C4A882;
          font-size: 22px;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          transition: color 0.2s;
        }
        .dl-close-btn:hover { color: #F7E7CE; }
        @media (max-width: 1023px) { .dl-close-btn { display: block; } }

        /* ── NAV ── */
        .dl-nav {
          flex: 1;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
        }
        .dl-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #C4A882;
          text-decoration: none;
          border: 1px solid transparent;
          transition: all 0.18s;
          cursor: pointer;
        }
        .dl-nav-item:hover {
          background: rgba(247,231,206,0.04);
          color: #F7E7CE;
        }
        .dl-nav-item.active {
          background: rgba(212,168,83,0.08);
          color: #D4A853;
          border-color: rgba(212,168,83,0.2);
        }
        .dl-nav-icon { font-size: 17px; width: 22px; text-align: center; flex-shrink: 0; }
        .dl-nav-badge {
          margin-left: auto;
          font-size: 11px;
          font-weight: 600;
          background: rgba(212,168,83,0.15);
          color: #D4A853;
          padding: 2px 8px;
          border-radius: 999px;
        }

        /* ── SIDEBAR BOTTOM ── */
        .dl-sidebar-bottom {
          padding: 12px 10px;
          border-top: 1px solid #2A4A42;
        }
        .dl-plan-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: rgba(212,168,83,0.06);
          border: 1px solid rgba(212,168,83,0.2);
          border-radius: 10px;
          margin-bottom: 10px;
        }
        .dl-plan-label { font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #D4A853; }
        .dl-plan-upgrade { font-size: 11px; background: rgba(212,168,83,0.15); color: #D4A853; padding: 3px 10px; border-radius: 999px; }
        .dl-usage { margin-bottom: 12px; }
        .dl-usage-row { display: flex; justify-content: space-between; font-size: 11px; color: #8A7560; margin-bottom: 6px; }
        .dl-usage-val { color: #D4A853; }
        .dl-usage-bar { height: 4px; background: #2A4A42; border-radius: 999px; overflow: hidden; }
        .dl-usage-fill { height: 100%; background: linear-gradient(90deg, #D4A853, #F0C96A); border-radius: 999px; }
        .dl-user-row { display: flex; align-items: center; gap: 10px; padding: 6px 4px; }
        .dl-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #D4A853, #C4983F); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #0D2420; font-family: 'Cormorant Garamond', serif; flex-shrink: 0; }
        .dl-user-info { flex: 1; overflow: hidden; }
        .dl-user-name { font-size: 13px; font-weight: 500; color: #F7E7CE; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dl-user-email { font-size: 11px; color: #8A7560; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dl-logout { background: none; border: none; cursor: pointer; color: #8A7560; font-size: 16px; padding: 4px; transition: color 0.2s; flex-shrink: 0; }
        .dl-logout:hover { color: #E05C5C; }

        /* ── MAIN AREA ── */
        .dl-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          /* Desktop: offset for sidebar */
          margin-left: 240px;
        }
        @media (max-width: 1023px) {
          .dl-main { margin-left: 0; }
        }

        /* ── TOPBAR ── */
        .dl-topbar {
          height: 64px;
          background: rgba(16,44,38,0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid #2A4A42;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          position: sticky;
          top: 0;
          z-index: 30;
          gap: 12px;
        }
        .dl-topbar-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .dl-hamburger {
          display: none;
          background: none;
          border: none;
          color: #C4A882;
          font-size: 22px;
          cursor: pointer;
          padding: 4px;
          flex-shrink: 0;
          line-height: 1;
          transition: color 0.2s;
        }
        .dl-hamburger:hover { color: #F7E7CE; }
        @media (max-width: 1023px) { .dl-hamburger { display: block; } }

        .dl-page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 700;
          color: #F7E7CE;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dl-page-sub {
          font-size: 12px;
          color: #8A7560;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dl-topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .dl-notif-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: #1A3D35;
          border: 1px solid #2A4A42;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        .dl-notif-btn:hover { border-color: rgba(212,168,83,0.3); background: #223D37; }
        .dl-notif-dot {
          position: absolute; top: 6px; right: 6px;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #D4A853;
          border: 2px solid #0D2420;
        }
        .dl-user-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D4A853, #C4983F);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700;
          color: #0D2420;
          font-family: 'Cormorant Garamond', serif;
          border: 2px solid rgba(212,168,83,0.3);
          cursor: pointer;
          flex-shrink: 0;
        }

        /* ── PAGE CONTENT ── */
        .dl-content {
          flex: 1;
          padding: 20px 16px;
          overflow-x: hidden;
        }
        @media (min-width: 640px)  { .dl-content { padding: 24px 20px; } }
        @media (min-width: 768px)  { .dl-content { padding: 28px 28px; } }
        @media (min-width: 1024px) { .dl-content { padding: 32px 36px; } }

        .dl-content-inner {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }
      `}</style>

      <div className="dl-shell">

        {/* Overlay */}
        <div
          className={`dl-overlay${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* ── SIDEBAR ── */}
        <aside className={`dl-sidebar${sidebarOpen ? ' open' : ''}`}>

          {/* Sidebar Header */}
          <div className="dl-sidebar-header">
            <LogoCompact className="h-9" />
            <button className="dl-close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>

          {/* Nav */}
          <nav className="dl-nav">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`dl-nav-item${isActive(item.href) ? ' active' : ''}`}
              >
                <span className="dl-nav-icon">{item.icon}</span>
                {item.label}
                {item.badge && <span className="dl-nav-badge">{item.badge}</span>}
              </Link>
            ))}
          </nav>

          {/* Bottom */}
          <div className="dl-sidebar-bottom">
            {/* Plan */}
            <div className="dl-plan-pill">
              <span className="dl-plan-label">Free Plan</span>
              <span className="dl-plan-upgrade">Upgrade</span>
            </div>

            {/* Usage */}
            <div className="dl-usage">
              <div className="dl-usage-row">
                <span>Messages Used</span>
                <span className="dl-usage-val">347 / 500</span>
              </div>
              <div className="dl-usage-bar">
                <div className="dl-usage-fill" style={{ width: '69%' }} />
              </div>
            </div>

            {/* User */}
            <div className="dl-user-row">
              <div className="dl-avatar">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="dl-user-info">
                <div className="dl-user-name">
                  {user?.user_metadata?.name || 'User'}
                </div>
                <div className="dl-user-email">{user?.email}</div>
              </div>
              <button className="dl-logout" onClick={handleLogout} title="Logout">⏻</button>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="dl-main">

          {/* Topbar */}
          <header className="dl-topbar">
            <div className="dl-topbar-left">
              <button className="dl-hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
              <div style={{ minWidth: 0 }}>
                <div className="dl-page-title">{title}</div>
                {subtitle && <div className="dl-page-sub">{subtitle}</div>}
              </div>
            </div>
            <div className="dl-topbar-right">
              <div className="dl-notif-btn">
                🔔
                <span className="dl-notif-dot" />
              </div>
              <div className="dl-user-avatar">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="dl-content">
            <div className="dl-content-inner">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}