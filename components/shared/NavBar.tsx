'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface SidebarProps {
  userName: string
  role: 'admin' | 'manager'
}

const MAIN_LINKS = [
  { href: '/',            label: 'Dashboard',   icon: '▪' },
  { href: '/approvals',   label: 'Approvals',   icon: '✓' },
  { href: '/work-orders', label: 'Work Orders', icon: '⚙' },
  { href: '/inspections', label: 'Inspections', icon: '◎' },
]

const TENANT_LINKS_ADMIN = [
  { href: '/tenants',  label: 'Tenant Reports', icon: '◷' },
  { href: '/qr-codes', label: 'QR Codes',       icon: '⬛' },
]

const TENANT_LINKS_MANAGER = [
  { href: '/tenants', label: 'Tenant Reports', icon: '◷' },
]

export function NavBar({ userName, role }: SidebarProps) {
  const pathname = usePathname()

  const tenantLinks = role === 'admin' ? TENANT_LINKS_ADMIN : TENANT_LINKS_MANAGER

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const initials = userName.trim()
    ? userName.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <aside aria-label="Application navigation" className="w-[220px] min-w-[220px] h-screen bg-slate-900 border-r border-slate-800 flex flex-col sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-3">
        <span className="bg-amber-500 text-slate-900 font-black text-xs px-2.5 py-1.5 rounded-md tracking-wide">
          MACTOR
        </span>
        <div>
          <div className="text-slate-300 text-xs font-semibold leading-none">Pro</div>
          <div className="text-slate-600 text-[10px] mt-0.5">Building Mgmt</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <h2 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 mb-2">Main</h2>
        {MAIN_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              isActive(link.href)
                ? 'bg-indigo-600/15 text-indigo-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="text-xs opacity-70" aria-hidden="true">{link.icon}</span>
            {link.label}
          </Link>
        ))}

        <h2 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 mb-2 mt-5">Tenants</h2>
        {tenantLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              isActive(link.href)
                ? 'bg-indigo-600/15 text-indigo-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="text-xs opacity-70" aria-hidden="true">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-slate-300 text-xs font-semibold truncate">{userName}</div>
            <div className="text-slate-600 text-[10px] capitalize">{role}</div>
          </div>
          <button
            aria-label="Sign out"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-slate-600 hover:text-slate-400 text-xs flex-shrink-0"
            title="Sign out"
          >
            ↩
          </button>
        </div>
      </div>
    </aside>
  )
}
