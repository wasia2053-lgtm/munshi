"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SidebarProfile from './SidebarProfile'

const navItems = [
  { label: 'Overview', icon: 'dashboard', href: '/dashboard' },
  { label: 'WhatsApp', icon: 'chat', href: '/dashboard/whatsapp' },
  { label: 'Training', icon: 'school', href: '/dashboard/training' },
  { label: 'Analytics', icon: 'analytics', href: '/dashboard/analytics' },
  { label: 'Billing', icon: 'payments', href: '/dashboard/billing' },
  { label: 'Conversations', icon: 'forum', href: '/dashboard/conversations' },
  { label: 'Settings', icon: 'settings', href: '/dashboard/settings' },
]

export function DashboardLayout({
  children,
  title,
  subtitle
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
}) {
  return <DashboardLayoutInner title={title} subtitle={subtitle}>{children}</DashboardLayoutInner>
}

function DashboardLayoutInner({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-[#121314] text-[#e3e2e2]">
      {/* Sidebar */}
      <aside className="fixed left-0 h-full w-[280px] bg-[#0d0e0f]/40 backdrop-blur-[12px] border-r border-white/5 flex-col py-8 z-40 hidden md:flex">
        <div className="px-8 mb-12">
          <div className="text-[11px] font-semibold text-[#c4c7c8] tracking-widest mb-1 uppercase">
            Munshi Console
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#4ae176]" style={{ boxShadow: '0 0 8px #4ae176' }} />
            <span className="text-sm text-[#4ae176]">Automation Active</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl transition-all duration-300 ${active
                    ? 'text-[#4ae176] font-bold bg-white/[0.03] border border-white/10 backdrop-blur-xl'
                    : 'text-[#c4c7c8] hover:bg-white/5'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-6 mt-auto">
          <Link
            href="/dashboard/whatsapp"
            className="w-full py-4 rounded-xl flex items-center justify-center gap-2 bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all active:scale-95 group"
          >
            <span className="material-symbols-outlined text-[#4ae176] text-[20px] group-hover:rotate-12 transition-transform">
              add_circle
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide">Connect WhatsApp</span>
          </Link>
          <div className="mt-8 px-2">
            <SidebarProfile />
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#121314]/80 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-around px-4">
        {navItems.slice(0, 4).map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 ${active ? 'text-[#4ae176]' : 'text-[#c4c7c8]'}`}>
              <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-[280px] min-h-screen relative pb-20 md:pb-0">
  {title && (
    <div className="px-8 pt-8 pb-2">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {subtitle && <p className="text-sm text-white/50 mt-1">{subtitle}</p>}
    </div>
  )}
  {children}
</main>
    </div>
  )
}
export default DashboardLayout