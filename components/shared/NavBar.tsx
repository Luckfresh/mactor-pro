'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface NavBarProps {
  userName: string
  role: 'admin' | 'manager'
}

export function NavBar({ userName, role }: NavBarProps) {
  const pathname = usePathname()

  const adminLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/approvals', label: 'Approvals' },
    { href: '/settings', label: 'Settings' },
  ]

  const managerLinks = [
    { href: '/', label: 'Overview' },
    { href: '/approvals', label: 'Approvals' },
    { href: '/history', label: 'History' },
  ]

  const links = role === 'admin' ? adminLinks : managerLinks

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="bg-amber-500 text-slate-900 font-black text-sm px-3 py-1 rounded-md">
          MACTOR
        </span>
        <div className="flex gap-4">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'text-sky-400 border-b-2 border-sky-400 pb-px'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-slate-400 text-sm">{userName}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-slate-500 hover:text-slate-300 text-xs"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
