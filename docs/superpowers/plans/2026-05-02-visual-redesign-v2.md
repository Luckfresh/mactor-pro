# Visual Redesign v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace dark flat UI with Light/Dark hybrid — dark sidebar + light content area, indigo accent, world-class enterprise feel.

**Architecture:** The layout switches from a horizontal topbar to a vertical sidebar (220px fixed). The page background becomes gray-50, cards become white with subtle borders/shadows. Color system: amber=brand only, indigo=interactive accent, status colors unchanged in role but updated to light-bg chip variants.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, next-auth v5

**Spec:** `docs/superpowers/specs/2026-05-02-visual-redesign-v2.md`

**Design reference:** `mactor-pro-design-preview.html` (Desktop)

---

## Shared Tailwind Patterns (reference for all tasks)

```
CARD:        bg-white rounded-xl border border-gray-200 shadow-sm
CARD HOVER:  hover:shadow-md hover:border-gray-300 transition-all
PAGE BG:     bg-gray-50 (set in layout)
SECTION HDR: text-xs font-bold text-slate-500 uppercase tracking-widest
DIVIDER:     border-gray-100
INPUT:       bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400

BADGE STATUS (light):
  Reported:    bg-purple-50 text-purple-700 border border-purple-200
  Pending:     bg-indigo-50 text-indigo-700 border border-indigo-200
  Claimed:     bg-sky-50 text-sky-700 border border-sky-200
  In Progress: bg-orange-50 text-orange-700 border border-orange-200
  Completed:   bg-green-50 text-green-700 border border-green-200
  Rejected:    bg-red-50 text-red-700 border border-red-200
  Approved:    bg-green-50 text-green-700 border border-green-200
  Quoted:      bg-violet-50 text-violet-700 border border-violet-200

BUTTONS:
  Primary:   bg-indigo-600 text-white hover:bg-indigo-700 font-semibold
  Secondary: bg-white border border-gray-200 text-slate-700 hover:bg-gray-50
  Success:   bg-green-50 border border-green-200 text-green-700 hover:bg-green-100
  Danger:    bg-red-50 border border-red-200 text-red-700 hover:bg-red-100
  Warning:   bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100
  Indigo:    bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100
  Brand CTA: bg-amber-500 text-slate-900 hover:bg-amber-400 (tenant portal only)
```

---

## Task 1: Foundation — Sidebar + Layout

**Files:**
- Modify: `components/shared/NavBar.tsx` (full rewrite to vertical Sidebar)
- Modify: `app/(admin)/layout.tsx`

- [ ] **Step 1: Rewrite `components/shared/NavBar.tsx` as vertical Sidebar**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface SidebarProps {
  userName: string
  role: 'admin' | 'manager'
}

const MAIN_LINKS = [
  { href: '/',            label: 'Dashboard',      icon: '▪' },
  { href: '/approvals',   label: 'Approvals',      icon: '✓' },
  { href: '/work-orders', label: 'Work Orders',    icon: '⚙' },
  { href: '/inspections', label: 'Inspections',    icon: '◎' },
]

const TENANT_LINKS_ADMIN = [
  { href: '/tenants',   label: 'Tenant Reports', icon: '◷' },
  { href: '/qr-codes',  label: 'QR Codes',       icon: '⬛' },
]

const TENANT_LINKS_MANAGER = [
  { href: '/tenants', label: 'Tenant Reports', icon: '◷' },
]

export function NavBar({ userName, role }: SidebarProps) {
  const pathname = usePathname()

  const tenantLinks = role === 'admin' ? TENANT_LINKS_ADMIN : TENANT_LINKS_MANAGER

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <aside className="w-[220px] min-w-[220px] h-screen bg-slate-900 border-r border-slate-800 flex flex-col sticky top-0">
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
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 mb-2">Main</p>
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
            <span className="text-xs opacity-70">{link.icon}</span>
            {link.label}
          </Link>
        ))}

        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 mb-2 mt-5">Tenants</p>
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
            <span className="text-xs opacity-70">{link.icon}</span>
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
```

- [ ] **Step 2: Update `app/(admin)/layout.tsx`**

```tsx
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { NavBar } from '@/components/shared/NavBar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen bg-gray-50">
      <NavBar
        userName={session.user.name ?? ''}
        role={session.user.role}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd mactor-pro && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add components/shared/NavBar.tsx app/\(admin\)/layout.tsx
git commit -m "feat(design): sidebar replaces topbar, light layout foundation"
```

---

## Task 2: Shared Components — KPIRow, BuildingCard, HoursBar, RecentWorkTable

**Files:**
- Modify: `components/admin/KPIRow.tsx`
- Modify: `components/admin/BuildingCard.tsx`
- Modify: `components/shared/HoursBar.tsx`
- Modify: `components/admin/RecentWorkTable.tsx`

- [ ] **Step 1: Rewrite `components/admin/KPIRow.tsx`**

```tsx
import Link from 'next/link'

interface KPITile {
  label: string
  value: string | number
  sub?: string
  alert?: boolean
  warn?: boolean
  href?: string
}

interface KPIRowProps {
  tiles: KPITile[]
}

export function KPIRow({ tiles }: KPIRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {tiles.map(tile => {
        const borderAccent = tile.alert
          ? 'border-l-4 border-l-indigo-500'
          : tile.warn
          ? 'border-l-4 border-l-amber-400'
          : ''

        const inner = (
          <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full hover:shadow-md hover:border-gray-300 transition-all ${borderAccent}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{tile.label}</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1.5">
              {tile.value}
            </p>
            {tile.sub && (
              <p className={`text-xs font-medium ${
                tile.alert ? 'text-indigo-600' :
                tile.warn  ? 'text-amber-600' :
                tile.sub.includes('✓') ? 'text-green-600' :
                'text-slate-500'
              }`}>
                {tile.sub}
              </p>
            )}
          </div>
        )
        return tile.href ? (
          <Link key={tile.label} href={tile.href} className="block">
            {inner}
          </Link>
        ) : (
          <div key={tile.label}>{inner}</div>
        )
      })}
    </div>
  )
}
```

Note: `app/(admin)/page.tsx` passes `warn` for Pending Inspections tile. Add `warn` to the KPI object there:
```ts
{
  label: 'Pending Inspections',
  value: totalPendingInspections,
  sub: totalPendingInspections > 0 ? 'Awaiting start →' : 'None pending ✓',
  warn: totalPendingInspections > 0,
  href: totalPendingInspections > 0 ? '/inspections' : undefined,
},
```

- [ ] **Step 2: Rewrite `components/admin/BuildingCard.tsx`**

```tsx
import Link from 'next/link'
import type { BuildingStats } from '@/types'

const ACCENT: Record<number, string> = {
  0: 'border-l-indigo-500',
  1: 'border-l-sky-500',
  2: 'border-l-violet-500',
}

interface BuildingCardProps {
  stats: BuildingStats
  index: number
  cycleStart: string
  cycleEnd: string
}

export function BuildingCard({ stats, index, cycleStart, cycleEnd }: BuildingCardProps) {
  const slug = encodeURIComponent(stats.name)
  const shortName = stats.name.replace('PHASE I ', '').replace('PHASE II ', '').replace('PHASE III ', '')

  return (
    <Link href={`/buildings/${slug}`} className="block group">
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm border-l-4 ${ACCENT[index % 3]} hover:shadow-md hover:border-gray-300 transition-all`}>
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-slate-900 font-bold text-sm">{shortName}</h3>
          <p className="text-slate-500 text-xs mt-0.5">{stats.name.split(' ')[0]} {stats.name.split(' ')[1]} · {stats.units.length} units</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-y-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Hours</p>
            <p className="text-xl font-extrabold text-indigo-600 tracking-tight">{stats.hoursUsedThisCycle.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Materials</p>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              ${stats.materialsThisCycle.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <div className="px-5 pb-4 flex items-center justify-between">
          {stats.pendingApprovals > 0 ? (
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
              {stats.pendingApprovals} pending approval{stats.pendingApprovals !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
              All clear ✓
            </span>
          )}
          <span className="text-slate-400 text-xs group-hover:text-slate-600 transition-colors">→</span>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Rewrite `components/shared/HoursBar.tsx`**

```tsx
interface HoursBarProps {
  used: number
  plan: number
  rollover?: number
  cycleRange?: string
  showWarning?: boolean
}

export function HoursBar({ used, plan, rollover = 0, cycleRange, showWarning }: HoursBarProps) {
  const available = plan + rollover
  const remaining = Math.max(0, available - used)
  const pct = available > 0 ? Math.min(100, Math.round((used / available) * 100)) : 0
  const isHigh = pct >= 80
  const hasExtra = used > available

  return (
    <div>
      {cycleRange && (
        <p className="text-slate-500 text-xs mb-2">Cycle: {cycleRange}</p>
      )}
      <div className="flex justify-between text-xs mb-2">
        <span className={`font-medium ${isHigh ? 'text-amber-600' : 'text-slate-600'}`}>
          {used.toFixed(1)}h used of {available.toFixed(1)}h
          {rollover > 0 && <span className="text-indigo-500 ml-1">(+{rollover.toFixed(1)}h rollover)</span>}
        </span>
        <span className={`font-semibold ${hasExtra ? 'text-red-600' : isHigh ? 'text-amber-600' : 'text-slate-500'}`}>
          {hasExtra ? `${(used - available).toFixed(1)}h over` : `${remaining.toFixed(1)}h left`}
        </span>
      </div>
      <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            hasExtra ? 'bg-red-500' : isHigh ? 'bg-amber-400' : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showWarning && isHigh && !hasExtra && (
        <p className="text-amber-600 text-xs mt-1.5 font-medium">⚠ Hours running low this cycle</p>
      )}
      {showWarning && hasExtra && (
        <p className="text-red-600 text-xs mt-1.5 font-medium">Over plan — extra hours at $75/h</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Rewrite `components/admin/RecentWorkTable.tsx`**

```tsx
import Link from 'next/link'
import { formatDate } from '@/lib/hours'
import type { Visit } from '@/types'

interface RecentWorkTableProps {
  visits: Visit[]
}

const BUILDING_SHORT: Record<string, string> = {
  'PHASE I 72 Isabella': 'Ph I',
  'PHASE II Church': 'Ph II',
  'PHASE III Wellesley': 'Ph III',
}

const BUILDING_CHIP: Record<string, string> = {
  'PHASE I 72 Isabella': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'PHASE II Church': 'bg-sky-50 text-sky-700 border-sky-200',
  'PHASE III Wellesley': 'bg-violet-50 text-violet-700 border-violet-200',
}

export function RecentWorkTable({ visits }: RecentWorkTableProps) {
  if (visits.length === 0) {
    return <p className="text-slate-500 text-sm">No recent work.</p>
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-[90px_76px_1fr_130px_64px_88px_88px] gap-2 px-5 py-2.5 bg-gray-50 border-b border-gray-200">
        {['Date','Building','Unit / Area','Work Type','Hours','Cost','Status'].map(h => (
          <span key={h} className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{h}</span>
        ))}
      </div>
      {visits.map((v, i) => {
        const buildingSlug = encodeURIComponent(v.building)
        const unitSlug = encodeURIComponent(v.unitId)
        const tag = BUILDING_SHORT[v.building] ?? v.building
        const chipColor = BUILDING_CHIP[v.building] ?? 'bg-slate-100 text-slate-600 border-slate-200'

        return (
          <Link
            key={i}
            href={`/buildings/${buildingSlug}/units/${unitSlug}`}
            className="grid grid-cols-[90px_76px_1fr_130px_64px_88px_88px] gap-2 px-5 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
          >
            <span className="text-slate-500 text-xs self-center">{formatDate(v.date)}</span>
            <span className="self-center">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${chipColor}`}>{tag}</span>
            </span>
            <span className="text-slate-900 text-sm font-medium truncate self-center">{v.areaName || v.unitId}</span>
            <span className="text-slate-600 text-sm truncate self-center">{v.visitType}</span>
            <span className="text-slate-900 text-sm font-medium self-center">{v.duration.toFixed(1)}h</span>
            <span className="text-slate-600 text-sm self-center">
              {v.materialCost > 0
                ? `$${v.materialCost.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'}
            </span>
            <span className="self-center">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                v.status === 'Completed'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : v.status === 'Pending'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                {v.status}
              </span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: Update `app/(admin)/page.tsx` — add `warn` to Pending Inspections KPI**

Find this block in `app/(admin)/page.tsx` and update it:
```ts
{
  label: 'Pending Inspections',
  value: totalPendingInspections,
  sub: totalPendingInspections > 0 ? 'Awaiting start →' : 'None pending ✓',
  warn: totalPendingInspections > 0,   // add this line
  href: totalPendingInspections > 0 ? '/inspections' : undefined,
},
```

Also update the dashboard section headers and card wrapper in `app/(admin)/page.tsx`:
```tsx
// Service Plan card — replace bg-slate-800 wrapper:
<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-8">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-slate-900 font-semibold text-sm">Service Plan — {activePlan!.clientName}</h2>
      <p className="text-slate-500 text-xs">{cycleRange}</p>
    </div>
    ...

// Section headers — replace text-slate-300 text-sm font-semibold uppercase tracking-wide:
<h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Buildings</h2>
// and
<h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Recent Work</h2>

// Page title:
<h1 className="text-slate-900 text-2xl font-bold">Dashboard</h1>
<p className="text-slate-500 text-sm mt-1">All buildings overview</p>
```

- [ ] **Step 6: Verify TypeScript + commit**

```bash
npx tsc --noEmit
git add components/admin/KPIRow.tsx components/admin/BuildingCard.tsx components/shared/HoursBar.tsx components/admin/RecentWorkTable.tsx "app/(admin)/page.tsx"
git commit -m "feat(design): shared components — KPIRow, BuildingCard, HoursBar, RecentWorkTable"
```

---

## Task 3: Approvals Page + ApprovalActions

**Files:**
- Modify: `app/(admin)/approvals/page.tsx`
- Modify: `components/admin/ApprovalActions.tsx`

- [ ] **Step 1: Update `app/(admin)/approvals/page.tsx`**

Replace all style classes. Full file:

```tsx
import { auth } from '@/lib/auth/config'
import { getReviewLog } from '@/lib/sheets/review-log'
import { getCurrentCycleLabel } from '@/lib/hours'
import { ApprovalActions } from '@/components/admin/ApprovalActions'
import Link from 'next/link'

const CYCLE_DAY_START = 25

export default async function ApprovalsPage() {
  const cycleLabel = getCurrentCycleLabel(CYCLE_DAY_START)
  const allPending = await getReviewLog({ approved: false, cycleLabel })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-slate-900 text-2xl font-bold">Approvals</h1>
        <p className="text-slate-500 text-sm mt-1">
          {allPending.length} pending this cycle
        </p>
      </div>

      {allPending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
          <p className="text-green-600 font-semibold text-base">All caught up ✓</p>
          <p className="text-slate-500 text-sm mt-1">No pending approvals this cycle.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Review — {cycleLabel}</h2>
          </div>
          {allPending.map(entry => (
            <div key={entry.visitKey} className="px-5 py-4 border-b border-gray-100 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-slate-900 text-sm font-semibold">{entry.unitId}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 text-xs">{entry.building.replace('PHASE ', 'P')}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 text-xs">{entry.date}</span>
                  </div>
                  <p className="text-slate-700 text-sm">{entry.workPerformed || entry.visitType}</p>
                  <p className="text-slate-400 text-xs mt-1">{entry.technician} · {entry.hours}h</p>
                </div>
                <div className="flex-shrink-0">
                  <ApprovalActions entry={entry} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update `components/admin/ApprovalActions.tsx`** — replace button/textarea styles

Find and replace all Tailwind classes in this file:
- `bg-slate-700` inputs/textareas → `bg-white border-gray-200`
- `text-white` → `text-slate-900`
- Approve button: `bg-green-700/40 text-green-300 hover:bg-green-700/70` → `bg-green-50 border border-green-200 text-green-700 hover:bg-green-100`
- Reject button: `bg-red-900/40 text-red-300 hover:bg-red-900/70` → `bg-red-50 border border-red-200 text-red-700 hover:bg-red-100`
- Confirm button: `bg-red-700 text-white` → `bg-red-600 text-white hover:bg-red-700`
- Cancel link: `text-slate-400 hover:text-white` → `text-slate-500 hover:text-slate-700`
- Container div: remove `bg-slate-800` if present

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit
git add "app/(admin)/approvals/page.tsx" components/admin/ApprovalActions.tsx
git commit -m "feat(design): approvals page light theme"
```

---

## Task 4: Work Orders Pages + WorkOrderActions

**Files:**
- Modify: `app/(admin)/work-orders/page.tsx`
- Modify: `components/admin/WorkOrderActions.tsx`
- Modify: `app/(admin)/work-orders/new/page.tsx`

- [ ] **Step 1: Update `app/(admin)/work-orders/page.tsx`**

Key replacements — STATUS_CHIP record (light theme):
```tsx
const STATUS_CHIP: Record<string, string> = {
  Reported:    'bg-purple-50 text-purple-700 border border-purple-200',
  Pending:     'bg-indigo-50 text-indigo-700 border border-indigo-200',
  Claimed:     'bg-sky-50 text-sky-700 border border-sky-200',
  'In Progress':'bg-orange-50 text-orange-700 border border-orange-200',
  Completed:   'bg-green-50 text-green-700 border border-green-200',
  Rejected:    'bg-red-50 text-red-700 border border-red-200',
}
```

Page structure replacements:
- `text-white text-2xl font-bold` → `text-slate-900 text-2xl font-bold`
- `text-slate-400 text-sm` (subtitle) → `text-slate-500 text-sm`
- Section cards: `bg-slate-800 rounded-xl overflow-hidden` → `bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden`
- Section headers: `px-4 py-3 border-b border-slate-700` div + `text-slate-300 text-sm font-semibold uppercase tracking-wide` → `px-5 py-3 bg-gray-50 border-b border-gray-100` + `text-xs font-bold text-slate-500 uppercase tracking-widest`
- Row dividers: `border-slate-700/50` → `border-gray-100`
- Row text: `text-white text-sm font-medium` → `text-slate-900 text-sm font-semibold`
- Secondary text: `text-slate-400 text-xs` → `text-slate-500 text-xs`
- `← Dashboard` link: `text-slate-400 text-sm hover:text-white` → `text-slate-500 text-sm hover:text-slate-700`
- New Work Order button: `bg-indigo-600 text-white` (already correct for primary)
- Status badge render: add `text-xs font-semibold px-2.5 py-0.5 rounded-full` to the chip span

- [ ] **Step 2: Update `components/admin/WorkOrderActions.tsx`** — button styles

Replace these specific patterns:
```tsx
// Claim button:
'text-xs px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold transition-colors'

// Start button:
'text-xs px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 font-semibold transition-colors'

// Complete button (inline form trigger):
'text-xs px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 font-semibold transition-colors'

// Approve button (manager):
'text-xs px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 font-semibold disabled:opacity-40 transition-colors'

// Reject button:
'text-xs px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-semibold transition-colors'

// Inline complete form inputs:
'text-xs bg-white border border-gray-200 text-slate-900 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500'

// Submit complete button:
'text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors'

// Cancel link:
'text-xs text-slate-500 hover:text-slate-700'
```

- [ ] **Step 3: Update `app/(admin)/work-orders/new/page.tsx`** — form styles

Full file replacement (form styles only, logic unchanged):
```tsx
'use client'

import { useActionState } from 'react'
import { actionCreateWorkOrder } from '@/app/(admin)/work-orders/actions'
import Link from 'next/link'

const BUILDINGS = ['PHASE I 72 Isabella', 'PHASE II Church', 'PHASE III Wellesley']
const PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'] as const

export default function NewWorkOrderPage() {
  const [error, formAction, isPending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try { await actionCreateWorkOrder(formData); return null }
      catch (e) { return e instanceof Error ? e.message : 'Error creating work order' }
    },
    null
  )

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/work-orders" className="text-slate-500 text-sm hover:text-slate-700">← Work Orders</Link>
        <h1 className="text-slate-900 text-2xl font-bold mt-2">New Work Order</h1>
        <p className="text-slate-500 text-sm mt-1">Create a work order for any building.</p>
      </div>

      <form action={formAction} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Building</label>
          <select name="building" required
            className="w-full bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Select building...</option>
            {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Unit ID</label>
            <input name="unitId" required placeholder="e.g. U-04"
              className="w-full bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Area Name</label>
            <input name="areaName" placeholder="e.g. Kitchen"
              className="w-full bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
          <textarea name="description" required rows={3} placeholder="Describe the issue or work needed..."
            className="w-full bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 resize-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Priority</label>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITIES.map(p => (
              <label key={p} className="flex flex-col items-center gap-1.5 cursor-pointer">
                <input type="radio" name="priority" value={p} className="sr-only peer" defaultChecked={p === 'Medium'} />
                <div className={`w-full text-center py-2 rounded-lg text-xs font-semibold border transition-colors peer-checked:ring-2 peer-checked:ring-indigo-500 ${
                  p === 'Low'       ? 'bg-green-50 text-green-700 border-green-200 peer-checked:bg-green-100' :
                  p === 'Medium'    ? 'bg-amber-50 text-amber-700 border-amber-200 peer-checked:bg-amber-100' :
                  p === 'High'      ? 'bg-orange-50 text-orange-700 border-orange-200 peer-checked:bg-orange-100' :
                                      'bg-red-50 text-red-700 border-red-200 peer-checked:bg-red-100'
                }`}>{p}</div>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" disabled={isPending}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors">
          {isPending ? 'Creating…' : 'Create Work Order'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Verify + commit**

```bash
npx tsc --noEmit
git add "app/(admin)/work-orders/page.tsx" components/admin/WorkOrderActions.tsx "app/(admin)/work-orders/new/page.tsx"
git commit -m "feat(design): work orders light theme + new WO form"
```

---

## Task 5: Inspections Pages + Forms

**Files:**
- Modify: `app/(admin)/inspections/page.tsx`
- Modify: `components/admin/InspectionRequestCard.tsx`
- Modify: `components/admin/NewInspectionRequestForm.tsx`
- Modify: `components/admin/InspectionForm.tsx`

- [ ] **Step 1: Update `app/(admin)/inspections/page.tsx`**

Replacements:
- Page title: `text-slate-900 text-2xl font-bold`
- Subtitle: `text-slate-500 text-sm`
- `+ Request Inspection` button: keep `bg-amber-500 text-slate-900 font-bold` (brand CTA)
- Empty state card: `bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center`
- Active table card: `bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden`
- Table header: `px-5 py-3 bg-gray-50 border-b border-gray-100` + `text-xs font-bold text-slate-500 uppercase tracking-widest`
- History card: same as active table, `opacity-80`
- History rows: `text-slate-700 text-xs font-medium`, `text-slate-500 text-xs`, status: `text-green-600`/`text-slate-400`

- [ ] **Step 2: Update `components/admin/InspectionRequestCard.tsx`**

Replacements:
- Row container: `px-5 py-4 border-b border-gray-100 last:border-0`
- Unit name: `text-slate-900 text-sm font-semibold`
- Building + date: `text-slate-500 text-xs`
- Notes text: `text-slate-600 text-xs`
- Status chips:
  ```tsx
  const STATUS_CHIP: Record<string, string> = {
    Pending:      'bg-amber-50 text-amber-700 border border-amber-200',
    'In Progress':'bg-sky-50 text-sky-700 border border-sky-200',
    Completed:    'bg-green-50 text-green-700 border border-green-200',
    Cancelled:    'bg-gray-100 text-gray-500 border border-gray-200',
  }
  ```
- Start button: `text-xs px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold disabled:opacity-40 transition-colors`
- Continue link: `text-xs px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-semibold transition-colors`
- Cancel button: `text-xs text-slate-400 hover:text-slate-600`
- Confirm cancel button: `text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold disabled:opacity-40`

- [ ] **Step 3: Update `components/admin/NewInspectionRequestForm.tsx`**

Form container: `bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5`
Labels: `text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5`
Selects/inputs: `w-full bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`
Textarea: add `resize-none`
Disabled state: `disabled:opacity-40`
Submit button: `w-full bg-amber-500 text-slate-900 font-bold py-3 rounded-xl hover:bg-amber-400 disabled:opacity-40 transition-colors`

- [ ] **Step 4: Update `components/admin/InspectionForm.tsx`** — wizard light theme

The wizard runs on mobile (field use) — keep the main card dark for readability in field:
- Unit info banner: `bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4`
- Banner text: `text-indigo-900 text-sm font-semibold` / `text-indigo-600 text-xs`
- Notes text: `text-slate-600 text-xs text-right`
- Main wizard card: `bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden`
- Progress bar track: `bg-gray-100`
- Progress fill: `bg-indigo-500`
- Step counter text: `text-slate-400 text-xs` / `text-slate-400 text-xs`
- Step title: `text-slate-900 text-lg font-bold`
- Step subtitle: `text-slate-500 text-sm`
- Labels: `text-xs font-semibold text-slate-500 uppercase tracking-wide`
- Selects: `bg-white border border-gray-200 text-slate-900 ... focus:ring-indigo-500 focus:border-indigo-500`
- Visit type buttons (inactive): `bg-gray-50 border border-gray-200 text-slate-600 hover:border-gray-300`
- Visit type buttons (active): `bg-indigo-600 border-indigo-600 text-white`
- Tenant Yes (active): `bg-green-50 border-2 border-green-500 text-green-700`
- Tenant No (active): `bg-gray-100 border-2 border-gray-400 text-slate-700`
- Tenant name input: same as selects above
- Start button: `bg-indigo-600 text-white font-bold ... hover:bg-indigo-700`
- Category OK (active): `bg-green-50 border-2 border-green-500 text-green-700`
- Category Minor (active): `bg-amber-50 border-2 border-amber-500 text-amber-700`
- Category Urgent (active): `bg-red-50 border-2 border-red-500 text-red-700`
- Category inactive: `bg-gray-50 border-2 border-gray-200 text-slate-500 hover:border-gray-300`
- Issue description box (Minor): `bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4`
- Issue description box (Urgent): `bg-red-50 border border-red-200 rounded-xl p-4 mb-4`
- Issue label Minor: `text-amber-700 text-xs font-semibold`
- Issue label Urgent: `text-red-700 text-xs font-semibold`
- Issue textarea: `bg-white border border-gray-200 text-slate-900 ...`
- Photo button: `border-dashed border-gray-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500`
- Back button: `border border-gray-200 text-slate-600 hover:bg-gray-50 hover:border-gray-300`
- Next button: `bg-indigo-600 text-white hover:bg-indigo-700`
- Summary items: `bg-gray-50 border-l-4 rounded-lg px-3 py-2.5`
- Summary item text: `text-slate-700 text-sm`
- Issues found box: `bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3`
- Issues found text: `text-indigo-700 text-sm font-semibold`
- No issues box: `bg-green-50 border border-green-100 rounded-xl px-4 py-3`
- Submit button: `bg-green-600 text-white font-bold hover:bg-green-700`
- Success screen: `bg-white rounded-2xl border border-gray-200 shadow-md p-8 text-center`
- Success check: `text-green-600 text-5xl`
- Success title: `text-slate-900 text-xl font-bold`
- Back to inspections link: `inline-block bg-amber-500 text-slate-900 font-bold ...`

- [ ] **Step 5: Verify + commit**

```bash
npx tsc --noEmit
git add "app/(admin)/inspections/page.tsx" components/admin/InspectionRequestCard.tsx components/admin/NewInspectionRequestForm.tsx components/admin/InspectionForm.tsx
git commit -m "feat(design): inspections pages + wizard light theme"
```

---

## Task 6: Tenants, QR Codes + TenantReportActions

**Files:**
- Modify: `app/(admin)/tenants/page.tsx`
- Modify: `components/admin/TenantReportActions.tsx`
- Modify: `app/(admin)/qr-codes/page.tsx`

- [ ] **Step 1: Update `app/(admin)/tenants/page.tsx`**

```tsx
import { auth } from '@/lib/auth/config'
import { getTenantReports } from '@/lib/sheets/tenant-reports'
import { TenantReportActions } from '@/components/admin/TenantReportActions'

const URGENCY_COLOR: Record<string, string> = {
  Low:       'bg-green-50 text-green-700 border-green-200',
  Medium:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  High:      'bg-amber-50 text-amber-700 border-amber-200',
  Emergency: 'bg-red-50 text-red-700 border-red-200',
}

export default async function TenantsPage() {
  const session = await auth()
  const all = await getTenantReports()
  const reports = session?.user.role === 'admin'
    ? all
    : all.filter(r => (session?.user.buildings ?? []).includes(r.building))

  const pending  = reports.filter(r => r.status === 'Pending')
  const resolved = reports.filter(r => r.status !== 'Pending').slice(0, 30)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-slate-900 text-2xl font-bold">Tenant Reports</h1>
        <p className="text-slate-500 text-sm mt-1">
          {pending.length} pending · {resolved.length} resolved
        </p>
      </div>

      {pending.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center mb-6">
          <p className="text-green-600 font-semibold">All caught up ✓</p>
          <p className="text-slate-500 text-sm mt-1">No pending tenant reports.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Review</h2>
          </div>
          {pending.map(r => (
            <div key={r.reportId} className="px-5 py-4 border-b border-gray-100 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-slate-900 text-sm font-semibold">{r.unitId}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 text-xs">{r.building.replace('PHASE ', 'P')}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${URGENCY_COLOR[r.urgency] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {r.urgency}
                    </span>
                    {r.wantsQuote && (
                      <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-semibold">Quote requested</span>
                    )}
                  </div>
                  <p className="text-slate-800 text-sm mb-1">{r.description}</p>
                  <p className="text-slate-400 text-xs">{r.tenantName} · {r.phone || r.email} · {r.date}</p>
                </div>
                <div className="flex-shrink-0">
                  <TenantReportActions report={r} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden opacity-75">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent History</h2>
          </div>
          {resolved.map(r => (
            <div key={r.reportId} className="grid grid-cols-[1fr_80px_80px] gap-2 px-5 py-3 border-b border-gray-100 last:border-0 items-center">
              <div>
                <p className="text-slate-700 text-xs font-medium">{r.description}</p>
                <p className="text-slate-400 text-xs">{r.tenantName} · {r.unitId} · {r.date}</p>
              </div>
              <span className="text-slate-500 text-xs">{r.building.replace('PHASE ', 'P')}</span>
              <span className={`text-xs font-semibold ${
                r.status === 'Resolved' ? 'text-green-600' :
                r.status === 'Approved' ? 'text-indigo-600' :
                r.status === 'Rejected' ? 'text-red-600' : 'text-violet-600'
              }`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update `components/admin/TenantReportActions.tsx`** — button + form styles

Replace patterns:
- `bg-slate-700 text-white rounded px-2 py-1 border border-slate-600` textarea/input → `bg-white border border-gray-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500`
- Approve button: `bg-green-700/40 text-green-300 hover:bg-green-700/70` → `bg-green-50 border border-green-200 text-green-700 hover:bg-green-100`
- Reject button: `bg-red-900/40 text-red-300 hover:bg-red-900/70` → `bg-red-50 border border-red-200 text-red-700 hover:bg-red-100`
- Quote button: `bg-purple-900/40 text-purple-300 hover:bg-purple-900/70` → `bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100`
- Confirm reject: `bg-red-700 text-white` → `bg-red-600 text-white hover:bg-red-700`
- Send Quote: `bg-purple-700 text-white` → `bg-violet-600 text-white hover:bg-violet-700`
- Cancel: `text-slate-400 hover:text-white` → `text-slate-500 hover:text-slate-700`
- Status chips (non-pending): update colors to light theme
  ```tsx
  const colors: Record<string, string> = {
    Approved: 'text-indigo-600',
    Rejected: 'text-red-600',
    Quoted:   'text-violet-600',
    Resolved: 'text-green-600',
  }
  ```

- [ ] **Step 3: Update `app/(admin)/qr-codes/page.tsx`** — light theme

Replacements:
- Page title: `text-slate-900 text-2xl font-bold`
- Subtitle: `text-slate-500 text-sm`
- Print button: keep as secondary `bg-white border border-gray-200 text-slate-700 hover:bg-gray-50`
- Building section header: `text-xs font-bold text-slate-500 uppercase tracking-widest mb-4`
- QR cards: `bg-white rounded-xl border border-gray-200 shadow-sm` (remove BUILDING_COLOR dark variants)
- Unit name: `text-slate-900 text-sm font-semibold`
- Unit ID: `text-slate-500 text-xs`
- Open link: `text-indigo-600 text-xs hover:underline`

Also update `components/admin/PrintButton.tsx`:
```tsx
'use client'
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-white border border-gray-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
    >
      Print all
    </button>
  )
}
```

- [ ] **Step 4: Verify + commit**

```bash
npx tsc --noEmit
git add "app/(admin)/tenants/page.tsx" components/admin/TenantReportActions.tsx "app/(admin)/qr-codes/page.tsx" components/admin/PrintButton.tsx
git commit -m "feat(design): tenants + QR codes light theme"
git push
```

---

## Self-Review

**Spec coverage:**
- ✅ Sidebar replaces topbar (Task 1)
- ✅ bg-gray-50 page background (Task 1 layout)
- ✅ White cards with shadow + border (all tasks)
- ✅ Indigo accent for buttons/active (all tasks)
- ✅ Amber = brand mark only (sidebar logo + tenant CTA)
- ✅ Light status badges (Tasks 3-6)
- ✅ New typography hierarchy (all tasks)
- ✅ KPI cards with left-border accent (Task 2)
- ✅ Indigo gradient HoursBar (Task 2)
- ✅ Building cards — indigo/sky/violet accents (Task 2)
- ✅ Inspection wizard light theme (Task 5)

**Placeholder scan:** None found. All code is explicit.

**Type consistency:** `warn` prop added to KPITile in Task 2 — used in Task 2 Step 5. Consistent throughout.
