'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogoCompact } from './logos'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  title, 
  subtitle 
}) => {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      setLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        } else if (session) {
          setUser(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#102C26] flex items-center justify-center">
        <div className="text-[#F7E7CE]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#102C26]">
      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col w-[240px] bg-[#0D2420] border-r border-[#2A4A42]"
        style={{
          transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
          visibility: isMobile && !sidebarOpen ? 'hidden' : 'visible',
          transition: 'transform 0.3s ease-in-out, visibility 0.3s ease-in-out'
        }}
      >
        {/* Mobile Close Button */}
        {isMobile && sidebarOpen && (
          <div className="flex justify-between items-center p-4 border-b border-[#2A4A42]">
            <LogoCompact className="h-8" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-[#C4A882] hover:text-[#F7E7CE] text-2xl"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Desktop Logo */}
        {!isMobile && (
          <div className="p-6 border-b border-[#2A4A42]">
            <LogoCompact className="h-11" />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#C4A882] text-sm hover:bg-[rgba(247,231,206,0.04)] hover:text-[#F7E7CE] transition-all cursor-pointer border border-transparent">
              <span className="text-lg w-6 text-center">🏠</span>
              Dashboard
            </div>
          </Link>
          <Link href="/dashboard/whatsapp">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#C4A882] text-sm hover:bg-[rgba(247,231,206,0.04)] hover:text-[#F7E7CE] transition-all cursor-pointer border border-transparent">
              <span className="text-lg w-6 text-center">📱</span>
              WhatsApp
            </div>
          </Link>
          <Link href="/dashboard/training">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#C4A882] text-sm hover:bg-[rgba(247,231,206,0.04)] hover:text-[#F7E7CE] transition-all cursor-pointer border border-transparent">
              <span className="text-lg w-6 text-center">🧠</span>
              Train Bot
            </div>
          </Link>
          <Link href="/dashboard/conversations">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#C4A882] text-sm hover:bg-[rgba(247,231,206,0.04)] hover:text-[#F7E7CE] transition-all cursor-pointer border border-transparent">
              <span className="text-lg w-6 text-center">💬</span>
              Conversations
              <span className="ml-auto text-xs font-semibold bg-[rgba(212,168,83,0.15)] text-[#D4A853] px-2 py-1 rounded-full">
                5
              </span>
            </div>
          </Link>
          <Link href="/dashboard/analytics">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#C4A882] text-sm hover:bg-[rgba(247,231,206,0.04)] hover:text-[#F7E7CE] transition-all cursor-pointer border border-transparent">
              <span className="text-lg w-6 text-center">📊</span>
              Analytics
            </div>
          </Link>
          <Link href="/dashboard/settings">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#C4A882] text-sm hover:bg-[rgba(247,231,206,0.04)] hover:text-[#F7E7CE] transition-all cursor-pointer border border-transparent">
              <span className="text-lg w-6 text-center">⚙️</span>
              Settings
            </div>
          </Link>
        </nav>

        {/* Sidebar Bottom */}
        <div className="p-3 border-t border-[#2A4A42]">
          {/* Plan Pill */}
          <div className="flex items-center justify-between p-3 bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.2)] rounded-lg mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase text-[#D4A853]">
              Free Plan
            </span>
            <span className="text-xs bg-[rgba(212,168,83,0.15)] text-[#D4A853] px-2 py-1 rounded-full">
              Upgrade
            </span>
          </div>

          {/* Usage Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-[#8A7560] mb-2">
              <span>Messages Used</span>
              <span className="text-[#D4A853]">347 / 500</span>
            </div>
            <div className="h-1 bg-[#2A4A42] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#D4A853] to-[#F0C96A] rounded-full" style={{ width: '69%' }}></div>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 p-2 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4A853] to-[#C4983F] flex items-center justify-center text-sm font-bold text-[#0D2420] font-serif">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-[#F7E7CE] truncate">
                {user?.user_metadata?.name || 'User'}
              </div>
              <div className="text-xs text-[#8A7560] truncate">
                {user?.email}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm text-[#8A7560] hover:text-[#E05C5C] transition-colors"
              title="Logout"
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: isMobile ? '0' : '240px' }}>
        {/* Topbar */}
        <header className="h-16 bg-[rgba(16,44,38,0.8)] backdrop-blur-xl border-b border-[#2A4A42] flex items-center px-4 lg:px-8 sticky top-0 z-40 justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger Menu */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-[#C4A882] hover:text-[#F7E7CE] text-2xl"
              >
                ☰
              </button>
            )}
            
            <div className="flex flex-col">
              <h1 className="font-serif text-lg lg:text-xl font-bold text-[#F7E7CE]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-[#8A7560] mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-9 h-9 rounded-full bg-[#1A3D35] border border-[#2A4A42] flex items-center justify-center text-base hover:border-[rgba(212,168,83,0.3)] hover:bg-[#223D37] transition-all relative">
              🔔
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D4A853] border-2 border-[#0D2420]"></span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4A853] to-[#C4983F] flex items-center justify-center text-sm font-bold text-[#0D2420] font-serif cursor-pointer border-2 border-[rgba(212,168,83,0.3)]">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
