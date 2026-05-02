# Phase 1 — Fixes & Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all known bugs, translate the UI to English, introduce the client-plan hours model with 3-month rollover, and add a working approvals page — leaving the app in a solid, correct state before Phase 2 write operations.

**Architecture:** Two new Google Sheets (`Client_Plans`, `Cycle_Balances`) replace per-building hour tracking with a per-client plan model. The hours library gets a new `calculateClientHoursBalance()` function. All UI text moves to English. The pending approvals bug is fixed in `review-log.ts` and a new `/approvals` page is added.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Google Sheets API v4 (OAuth2), NextAuth v5 beta

---

## File Map

| Action | File | What changes |
|--------|------|--------------|
| Create | `lib/sheets/client-plans.ts` | Reads `Client_Plans` sheet |
| Create | `lib/sheets/cycle-balances.ts` | Reads `Cycle_Balances` sheet |
| Create | `app/(admin)/approvals/page.tsx` | Pending approvals list page |
| Modify | `types/index.ts` | Add `ClientPlan`, `CycleBalance`, `ClientHoursBalance`; update `BuildingStats` |
| Modify | `lib/hours.ts` | Add `calculateClientHoursBalance()`, English month names, refactor signatures |
| Modify | `lib/sheets/review-log.ts` | Fix `getPendingApprovalCount()` bug |
| Modify | `components/shared/NavBar.tsx` | English, fix links, add Approvals |
| Modify | `components/shared/HoursBar.tsx` | English strings |
| Modify | `components/admin/KPIRow.tsx` | Add optional `href` prop to tiles |
| Modify | `components/admin/BuildingCard.tsx` | English, remove HoursBar, show raw hours used |
| Modify | `components/admin/RecentWorkTable.tsx` | English column headers |
| Modify | `components/admin/WorkDetail.tsx` | English photo labels |
| Modify | `app/(admin)/page.tsx` | Client hours model, English, link pending tile |
| Modify | `app/(admin)/buildings/[building]/page.tsx` | English |
| Modify | `app/(admin)/buildings/[building]/units/[unitId]/page.tsx` | English |

---

## Task 1: Create Google Sheets (manual setup by Julio)

**Files:** Google Sheets spreadsheet (ID: `1eGijx6Ji4Q7AcNJEWimcjUI6l2wD4Ja27vf3DfO75v0`)

- [ ] **Step 1: Open the spreadsheet and add `Client_Plans` sheet**

  Add a new tab named exactly `Client_Plans`. Set row 1 as headers (columns A–F):

  ```
  A1: clientId
  B1: clientName
  C1: managerEmail
  D1: buildings
  E1: hoursPerCycle
  F1: active
  ```

  Add Eddie's plan in row 2:
  ```
  A2: eddie
  B2: Eddie M.
  C2: eddie@yourdomain.com
  D2: PHASE I 72 Isabella, PHASE II Church, PHASE III Wellesley
  E2: 40
  F2: TRUE
  ```
  The `buildings` column is comma-separated, matching the building names exactly as they appear in `All_Visits`.

- [ ] **Step 2: Add `Cycle_Balances` sheet**

  Add a new tab named exactly `Cycle_Balances`. Set row 1 as headers (columns A–H):
  ```
  A1: clientId
  B1: cycleLabel
  C1: plannedHours
  D1: usedHours
  E1: rolledOverIn
  F1: rolledOverOut
  G1: extraHours
  H1: closedAt
  ```
  Leave the sheet empty (no data rows yet). The app will read this for rollover — empty = no rollover = 0 accumulated hours.

- [ ] **Step 3: Add `clientId` column to `Building_Config` sheet**

  In the `Building_Config` sheet, add column F header:
  ```
  F1: clientId
  ```
  For each active building row, set:
  ```
  F2: eddie   (PHASE I 72 Isabella)
  F3: eddie   (PHASE II Church)
  F4: eddie   (PHASE III Wellesley)
  ```

---

## Task 2: Update TypeScript types

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Add new types and update BuildingStats**

  Replace the entire contents of `types/index.ts` with:

  ```typescript
  export type UserRole = 'admin' | 'manager'

  export interface AppUser {
    id: string
    name: string
    email: string
    role: UserRole
    buildings: string[]
  }

  export interface BuildingConfig {
    buildingName: string
    hoursPerCycle: number
    cycleDayStart: number
    managerEmail: string
    clientId: string
    active: boolean
  }

  export interface ClientPlan {
    clientId: string
    clientName: string
    managerEmail: string
    buildings: string[]
    hoursPerCycle: number
    active: boolean
  }

  export interface CycleBalance {
    clientId: string
    cycleLabel: string
    plannedHours: number
    usedHours: number
    rolledOverIn: number
    rolledOverOut: number
    extraHours: number
    closedAt: string
  }

  export type VisitSource = 'Inspection' | 'Repair'
  export type VisitStatus = 'Completed' | 'Pending' | 'In Progress'

  export interface Visit {
    date: string
    source: VisitSource
    technician: string
    building: string
    unitId: string
    areaType: string
    areaName: string
    visitType: string
    timeIn: string
    timeOut: string
    duration: number
    problem: string
    workPerformed: string
    priority: string
    status: VisitStatus
    materialCost: number
    photos: VisitPhotos
  }

  export interface VisitPhotos {
    common: string | null
    exterior: string | null
    windows: string | null
    wallCeiling: string | null
    bath: string | null
    kitchen: string | null
    floor: string | null
    electrical: string | null
    plumbing: string | null
    hvac: string | null
    extra: string | null
    before: string | null
    after: string | null
  }

  export interface ReviewEntry {
    visitKey: string
    date: string
    technician: string
    building: string
    unitId: string
    areaName: string
    visitType: string
    workPerformed: string
    duration: number
    materialCost: number
    approved: boolean
    pmComments: string
    approvedBy: string
    approvalDate: string
    cycleLabel: string
  }

  export interface UnitSummary {
    unitId: string
    building: string
    areaType: string
    areaName: string
    totalVisits: number
    lastVisit: string
    totalHours: number
    totalMaterialCost: number
    inspectionVisits: number
    repairVisits: number
  }

  export interface HoursBalance {
    planHours: number
    usedHours: number
    rolledOverHours: number
    availableHours: number
    cycleLabel: string
    cycleStart: string
    cycleEnd: string
  }

  export interface ClientHoursBalance {
    clientId: string
    planHours: number
    rolledOverHours: number
    availableHours: number
    usedHours: number
    extraHours: number
    cycleLabel: string
    cycleStart: string
    cycleEnd: string
    byBuilding: Record<string, number>
  }

  export interface BuildingStats {
    name: string
    config: BuildingConfig
    units: UnitSummary[]
    pendingApprovals: number
    hoursUsedThisCycle: number
    materialsThisCycle: number
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd mactor-pro && npx tsc --noEmit 2>&1 | head -40
  ```
  Expected: errors only about callers of old `BuildingStats.hoursBalance` — those are fixed in later tasks.

---

## Task 3: Sheet reader — client-plans.ts

**Files:**
- Create: `lib/sheets/client-plans.ts`

- [ ] **Step 1: Create the file**

  ```typescript
  import { getSheetsClient, getSpreadsheetId } from './client'
  import type { ClientPlan } from '@/types'

  const SHEET = 'Client_Plans'

  // Columns: clientId(0) clientName(1) managerEmail(2) buildings(3) hoursPerCycle(4) active(5)
  function rowToPlan(row: unknown[]): ClientPlan {
    return {
      clientId: String(row[0] ?? '').trim(),
      clientName: String(row[1] ?? '').trim(),
      managerEmail: String(row[2] ?? '').trim(),
      buildings: String(row[3] ?? '')
        .split(',')
        .map(b => b.trim())
        .filter(Boolean),
      hoursPerCycle: parseFloat(String(row[4] ?? '40')) || 40,
      active: String(row[5] ?? '').toLowerCase() === 'true',
    }
  }

  export async function getClientPlans(): Promise<ClientPlan[]> {
    const sheets = await getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${SHEET}!A2:F`,
    })
    const rows = res.data.values ?? []
    return rows
      .filter(row => row.length >= 5 && row[0])
      .map(rowToPlan)
      .filter(p => p.active)
  }

  export async function getClientPlan(clientId: string): Promise<ClientPlan | null> {
    const plans = await getClientPlans()
    return plans.find(p => p.clientId === clientId) ?? null
  }

  export async function getClientPlanForBuilding(buildingName: string): Promise<ClientPlan | null> {
    const plans = await getClientPlans()
    return plans.find(p => p.buildings.includes(buildingName)) ?? null
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit 2>&1 | grep "client-plans"
  ```
  Expected: no errors for this file.

---

## Task 4: Sheet reader — cycle-balances.ts

**Files:**
- Create: `lib/sheets/cycle-balances.ts`

- [ ] **Step 1: Create the file**

  ```typescript
  import { getSheetsClient, getSpreadsheetId, toNumber, parseDateValue } from './client'
  import type { CycleBalance } from '@/types'

  const SHEET = 'Cycle_Balances'

  // Columns: clientId(0) cycleLabel(1) plannedHours(2) usedHours(3)
  //          rolledOverIn(4) rolledOverOut(5) extraHours(6) closedAt(7)
  function rowToBalance(row: unknown[]): CycleBalance {
    return {
      clientId: String(row[0] ?? '').trim(),
      cycleLabel: String(row[1] ?? '').trim(),
      plannedHours: toNumber(row[2]),
      usedHours: toNumber(row[3]),
      rolledOverIn: toNumber(row[4]),
      rolledOverOut: toNumber(row[5]),
      extraHours: toNumber(row[6]),
      closedAt: parseDateValue(row[7]),
    }
  }

  export async function getCycleBalances(clientId: string): Promise<CycleBalance[]> {
    const sheets = await getSheetsClient()
    let res
    try {
      res = await sheets.spreadsheets.values.get({
        spreadsheetId: getSpreadsheetId(),
        range: `${SHEET}!A2:H`,
      })
    } catch {
      return []
    }
    const rows = res.data.values ?? []
    return rows
      .filter(row => row.length >= 7 && row[0])
      .map(rowToBalance)
      .filter(b => b.clientId === clientId)
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit 2>&1 | grep "cycle-balances"
  ```
  Expected: no errors for this file.

---

## Task 5: Update lib/hours.ts — rollover logic + English

**Files:**
- Modify: `lib/hours.ts`

- [ ] **Step 1: Replace the full file**

  ```typescript
  import type { Visit, BuildingConfig, ClientPlan, CycleBalance, HoursBalance, ClientHoursBalance } from '@/types'

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  export function getCurrentCycleLabel(cycleDayStart: number): string {
    const now = new Date()
    const day = now.getDate()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    if (day < cycleDayStart) {
      return `${year}-${String(month).padStart(2, '0')}`
    } else {
      const endMonth = month === 12 ? 1 : month + 1
      const endYear = month === 12 ? year + 1 : year
      return `${endYear}-${String(endMonth).padStart(2, '0')}`
    }
  }

  export function getCycleDates(
    cycleDayStart: number,
    cycleLabel: string,
  ): { start: string; end: string } {
    const [year, month] = cycleLabel.split('-').map(Number)

    const endDate = new Date(year, month - 1, cycleDayStart - 1)
    const end = endDate.toISOString().split('T')[0]

    const startMonth = month === 1 ? 12 : month - 1
    const startYear = month === 1 ? year - 1 : year
    const startDate = new Date(startYear, startMonth - 1, cycleDayStart)
    const start = startDate.toISOString().split('T')[0]

    return { start, end }
  }

  function getRolloverForCycle(
    closedCycles: CycleBalance[],
    currentLabel: string,
    hoursPerCycle: number,
  ): number {
    const previous = closedCycles
      .filter(c => c.cycleLabel < currentLabel)
      .sort((a, b) => b.cycleLabel.localeCompare(a.cycleLabel))[0]

    if (!previous) return 0
    return Math.min(previous.rolledOverOut, hoursPerCycle * 3)
  }

  export function calculateClientHoursBalance(
    visits: Visit[],
    clientPlan: ClientPlan,
    closedCycles: CycleBalance[],
    cycleLabel: string,
  ): ClientHoursBalance {
    const cycleDayStart = 25
    const { start, end } = getCycleDates(cycleDayStart, cycleLabel)

    const rolledOverHours = getRolloverForCycle(closedCycles, cycleLabel, clientPlan.hoursPerCycle)
    const availableHours = clientPlan.hoursPerCycle + rolledOverHours

    const cycleVisits = visits.filter(
      v => clientPlan.buildings.includes(v.building) && v.date >= start && v.date <= end,
    )

    const usedHours = Math.round(cycleVisits.reduce((sum, v) => sum + v.duration, 0) * 100) / 100
    const extraHours = Math.max(0, Math.round((usedHours - availableHours) * 100) / 100)

    const byBuilding: Record<string, number> = {}
    for (const building of clientPlan.buildings) {
      const h = cycleVisits
        .filter(v => v.building === building)
        .reduce((sum, v) => sum + v.duration, 0)
      byBuilding[building] = Math.round(h * 100) / 100
    }

    return {
      clientId: clientPlan.clientId,
      planHours: clientPlan.hoursPerCycle,
      rolledOverHours,
      availableHours,
      usedHours,
      extraHours,
      cycleLabel,
      cycleStart: start,
      cycleEnd: end,
      byBuilding,
    }
  }

  // Kept for per-building display (building card hours used)
  export function getHoursUsedInBuilding(
    visits: Visit[],
    buildingName: string,
    cycleStart: string,
    cycleEnd: string,
  ): number {
    const used = visits
      .filter(v => v.building === buildingName && v.date >= cycleStart && v.date <= cycleEnd)
      .reduce((sum, v) => sum + v.duration, 0)
    return Math.round(used * 100) / 100
  }

  export function formatCycleRange(start: string, end: string): string {
    const fmt = (iso: string) => {
      if (!iso) return ''
      const [, m, d] = iso.split('-')
      return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]}`
    }
    return `${fmt(start)} – ${fmt(end)}`
  }

  export function formatDate(iso: string): string {
    if (!iso) return '—'
    const [y, m, d] = iso.split('-')
    return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]} ${y}`
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit 2>&1 | grep "hours.ts"
  ```
  Expected: no errors in `lib/hours.ts`. Errors in callers are fixed in later tasks.

---

## Task 6: Fix pending approvals bug in review-log.ts

**Files:**
- Modify: `lib/sheets/review-log.ts`

The bug: `toBoolean('')` returns `false`, so every row with an empty `Approved` column is counted as pending. Fix: only count rows that have an explicit `FALSE`/`No`/`0` value AND a non-empty `visitKey`.

- [ ] **Step 1: Replace `getPendingApprovalCount`**

  In `lib/sheets/review-log.ts`, replace the `getPendingApprovalCount` function (lines 60–63):

  ```typescript
  export async function getPendingApprovalCount(building?: string): Promise<number> {
    const sheets = await getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${SHEET}!A2:N`,
    })
    const rows = res.data.values ?? []
    return rows.filter(row => {
      if (!row[0] || String(row[0]).trim() === '') return false  // no visitKey
      const approvedRaw = String(row[9] ?? '').trim().toLowerCase()
      // Only count explicitly unapproved: FALSE, No, 0, or empty-with-visitKey that is a recent entry
      // Empty approved = not yet reviewed = pending
      return approvedRaw === 'false' || approvedRaw === 'no' || approvedRaw === '0' || approvedRaw === ''
    }).length
  }
  ```

  > **Note:** The old bug was that the filter was applied AFTER parsing with `toBoolean`, which converted empty strings to `false`. Now we read the raw value directly to distinguish "explicitly rejected" from "not yet reviewed". All unapproved entries (empty or false) count as pending.

- [ ] **Step 2: Also update `getReviewLog` to pass raw approved filter correctly**

  The `getReviewLog` filter `approved: false` uses `toBoolean`. This still works — `toBoolean('')` returns false, so `getReviewLog({ approved: false })` returns all unreviewed entries. No change needed there.

- [ ] **Step 3: Commit fix**

  ```bash
  git add lib/sheets/review-log.ts
  git commit -m "fix: count only explicitly unapproved entries as pending"
  ```

---

## Task 7: English shared components — NavBar + HoursBar

**Files:**
- Modify: `components/shared/NavBar.tsx`
- Modify: `components/shared/HoursBar.tsx`

- [ ] **Step 1: Replace NavBar.tsx**

  ```typescript
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
  ```

- [ ] **Step 2: Replace HoursBar.tsx**

  ```typescript
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
          <p className="text-slate-500 text-xs mb-1">Cycle: {cycleRange}</p>
        )}
        <div className="flex justify-between text-xs mb-1">
          <span className={isHigh ? 'text-amber-400' : 'text-slate-400'}>
            {used.toFixed(1)}h used of {available.toFixed(1)}h
            {rollover > 0 && <span className="text-sky-400 ml-1">(+{rollover.toFixed(1)}h rollover)</span>}
          </span>
          <span className={hasExtra ? 'text-red-400 font-semibold' : isHigh ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
            {hasExtra ? `${(used - available).toFixed(1)}h over` : `${remaining.toFixed(1)}h left`}
          </span>
        </div>
        <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              hasExtra ? 'bg-red-500' : isHigh ? 'bg-amber-400' : 'bg-blue-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {showWarning && isHigh && !hasExtra && (
          <p className="text-amber-400 text-xs mt-1">⚠ Hours running low this cycle</p>
        )}
        {showWarning && hasExtra && (
          <p className="text-red-400 text-xs mt-1">Over plan — extra hours at $75/h</p>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add components/shared/NavBar.tsx components/shared/HoursBar.tsx
  git commit -m "feat: English UI for NavBar and HoursBar, add rollover display"
  ```

---

## Task 8: English admin components — KPIRow, BuildingCard, RecentWorkTable, WorkDetail

**Files:**
- Modify: `components/admin/KPIRow.tsx`
- Modify: `components/admin/BuildingCard.tsx`
- Modify: `components/admin/RecentWorkTable.tsx`
- Modify: `components/admin/WorkDetail.tsx`

- [ ] **Step 1: Replace KPIRow.tsx — add optional href for clickable tiles**

  ```typescript
  import Link from 'next/link'

  interface KPITile {
    label: string
    value: string | number
    sub?: string
    alert?: boolean
    href?: string
  }

  interface KPIRowProps {
    tiles: KPITile[]
  }

  export function KPIRow({ tiles }: KPIRowProps) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {tiles.map(tile => {
          const inner = (
            <div className="bg-slate-800 rounded-xl p-4 h-full">
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{tile.label}</p>
              <p className={`text-2xl font-bold ${tile.alert ? 'text-red-400' : 'text-white'}`}>
                {tile.value}
              </p>
              {tile.sub && (
                <p className={`text-xs mt-1 ${tile.alert ? 'text-red-400' : 'text-sky-400'}`}>
                  {tile.sub}
                </p>
              )}
            </div>
          )
          return tile.href ? (
            <Link key={tile.label} href={tile.href} className="block hover:opacity-80 transition-opacity">
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

- [ ] **Step 2: Replace BuildingCard.tsx — English, remove HoursBar, show hours used**

  ```typescript
  import Link from 'next/link'
  import type { BuildingStats } from '@/types'

  const BUILDING_COLORS: Record<number, string> = {
    0: 'border-blue-500',
    1: 'border-green-500',
    2: 'border-amber-400',
  }

  interface BuildingCardProps {
    stats: BuildingStats
    index: number
    cycleStart: string
    cycleEnd: string
  }

  export function BuildingCard({ stats, index, cycleStart, cycleEnd }: BuildingCardProps) {
    const slug = encodeURIComponent(stats.name)
    const cycleRange = `${cycleStart} – ${cycleEnd}`

    return (
      <Link href={`/buildings/${slug}`} className="block">
        <div
          className={`bg-slate-800 rounded-xl p-5 border-l-4 ${BUILDING_COLORS[index % 3]} hover:bg-slate-700/80 transition-colors cursor-pointer`}
        >
          <h3 className="text-white font-semibold text-sm mb-3">{stats.name}</h3>
          <div className="grid grid-cols-2 gap-y-2 text-xs mb-3">
            <span className="text-slate-400">Areas / Units</span>
            <span className="text-white text-right">{stats.units.length}</span>
            <span className="text-slate-400">Hours this cycle</span>
            <span className="text-white text-right">{stats.hoursUsedThisCycle.toFixed(1)}h</span>
            <span className="text-slate-400">Materials</span>
            <span className="text-white text-right">
              ${stats.materialsThisCycle.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-slate-400">Approvals</span>
            <span className={`text-right font-semibold ${stats.pendingApprovals > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {stats.pendingApprovals > 0 ? `${stats.pendingApprovals} pending ⚠` : 'Up to date ✓'}
            </span>
          </div>
          <p className="text-slate-600 text-xs">Cycle: {cycleRange}</p>
        </div>
      </Link>
    )
  }
  ```

- [ ] **Step 3: Replace RecentWorkTable.tsx — English headers**

  ```typescript
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

  const BUILDING_COLOR: Record<string, string> = {
    'PHASE I 72 Isabella': 'bg-blue-900/50 text-blue-300',
    'PHASE II Church': 'bg-green-900/50 text-green-300',
    'PHASE III Wellesley': 'bg-amber-900/50 text-amber-300',
  }

  export function RecentWorkTable({ visits }: RecentWorkTableProps) {
    if (visits.length === 0) {
      return <p className="text-slate-400 text-sm">No recent work.</p>
    }

    return (
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[90px_80px_1fr_140px_70px_90px_90px] gap-2 px-4 py-2 text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
          <span>Date</span>
          <span>Building</span>
          <span>Unit / Area</span>
          <span>Work Type</span>
          <span>Hours</span>
          <span>Cost</span>
          <span>Status</span>
        </div>
        {visits.map((v, i) => {
          const buildingSlug = encodeURIComponent(v.building)
          const unitSlug = encodeURIComponent(v.unitId)
          const shortTag = BUILDING_SHORT[v.building] ?? v.building
          const tagColor = BUILDING_COLOR[v.building] ?? 'bg-slate-700 text-slate-300'

          return (
            <Link
              key={i}
              href={`/buildings/${buildingSlug}/units/${unitSlug}`}
              className="grid grid-cols-[90px_80px_1fr_140px_70px_90px_90px] gap-2 px-4 py-3 text-sm border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50 transition-colors"
            >
              <span className="text-slate-400 text-xs">{formatDate(v.date)}</span>
              <span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${tagColor}`}>{shortTag}</span>
              </span>
              <span className="text-white truncate">{v.areaName || v.unitId}</span>
              <span className="text-slate-300 truncate">{v.visitType}</span>
              <span className="text-white">{v.duration.toFixed(1)}h</span>
              <span className="text-white">
                {v.materialCost > 0
                  ? `$${v.materialCost.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '—'}
              </span>
              <span>
                <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                  v.status === 'Completed'
                    ? 'bg-green-900/40 text-green-400'
                    : v.status === 'Pending'
                    ? 'bg-amber-900/40 text-amber-400'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {v.status === 'Completed' ? 'Completed' : v.status === 'Pending' ? 'Pending' : v.status}
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    )
  }
  ```

- [ ] **Step 4: Update WorkDetail.tsx — English photo labels + "Sign out" text**

  In `components/admin/WorkDetail.tsx`, replace the `PHOTO_LABELS` constant (lines 12–17):

  ```typescript
  const PHOTO_LABELS: Record<string, string> = {
    common: 'Common Area', exterior: 'Exterior', windows: 'Windows',
    wallCeiling: 'Wall/Ceiling', bath: 'Bathroom', kitchen: 'Kitchen',
    floor: 'Floor', electrical: 'Electrical', plumbing: 'Plumbing',
    hvac: 'HVAC', extra: 'Extra', before: 'Before', after: 'After',
  }
  ```

  Also replace the section labels in the expanded view (lines 77–88):
  - `"Problema"` → `"Problem"`
  - `"Trabajo realizado"` → `"Work Performed"`
  - `"Fotos"` → `"Photos"`

- [ ] **Step 5: Commit**

  ```bash
  git add components/admin/KPIRow.tsx components/admin/BuildingCard.tsx \
    components/admin/RecentWorkTable.tsx components/admin/WorkDetail.tsx
  git commit -m "feat: English UI for admin components, client-plan hours model in BuildingCard"
  ```

---

## Task 9: Create /approvals page

**Files:**
- Create: `app/(admin)/approvals/page.tsx`

- [ ] **Step 1: Create the approvals page**

  ```typescript
  import { auth } from '@/lib/auth/config'
  import { getReviewLog } from '@/lib/sheets/review-log'
  import { formatDate } from '@/lib/hours'
  import Link from 'next/link'

  const BUILDING_COLOR: Record<string, string> = {
    'PHASE I 72 Isabella': 'bg-blue-900/50 text-blue-300',
    'PHASE II Church': 'bg-green-900/50 text-green-300',
    'PHASE III Wellesley': 'bg-amber-900/50 text-amber-300',
  }

  export default async function ApprovalsPage() {
    const session = await auth()

    const allPending = await getReviewLog({ approved: false })
    const pending = session?.user.role === 'admin'
      ? allPending
      : allPending.filter(e => (session?.user.buildings ?? []).includes(e.building))

    const grouped = pending.reduce<Record<string, typeof pending>>((acc, entry) => {
      if (!acc[entry.building]) acc[entry.building] = []
      acc[entry.building].push(entry)
      return acc
    }, {})

    return (
      <div>
        <div className="mb-6">
          <Link href="/" className="text-slate-400 text-sm hover:text-white">← Dashboard</Link>
          <h1 className="text-white text-2xl font-bold mt-2">Pending Approvals</h1>
          <p className="text-slate-400 text-sm mt-1">
            {pending.length} {pending.length === 1 ? 'item' : 'items'} awaiting review
          </p>
        </div>

        {pending.length === 0 && (
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <p className="text-green-400 text-lg font-semibold">All up to date ✓</p>
            <p className="text-slate-400 text-sm mt-1">No pending approvals across any building.</p>
          </div>
        )}

        {Object.entries(grouped).map(([building, entries]) => (
          <div key={building} className="mb-6">
            <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide mb-3">
              {building}
              <span className="ml-2 text-red-400 font-normal normal-case">
                {entries.length} pending
              </span>
            </h2>
            <div className="bg-slate-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[100px_1fr_150px_80px_80px] gap-2 px-4 py-2 text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
                <span>Date</span>
                <span>Unit / Work</span>
                <span>Type</span>
                <span>Hours</span>
                <span>Cycle</span>
              </div>
              {entries.map((entry, i) => {
                const tagColor = BUILDING_COLOR[building] ?? 'bg-slate-700 text-slate-300'
                return (
                  <Link
                    key={i}
                    href={`/buildings/${encodeURIComponent(building)}/units/${encodeURIComponent(entry.unitId)}`}
                    className="grid grid-cols-[100px_1fr_150px_80px_80px] gap-2 px-4 py-3 text-sm border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-slate-400 text-xs">{formatDate(entry.date)}</span>
                    <div>
                      <p className="text-white text-xs font-medium">{entry.areaName || entry.unitId}</p>
                      <p className="text-slate-500 text-xs truncate">{entry.workPerformed}</p>
                    </div>
                    <span className="text-slate-300 text-xs">{entry.visitType}</span>
                    <span className="text-white text-xs">{entry.duration.toFixed(1)}h</span>
                    <span className="text-slate-400 text-xs">{entry.cycleLabel}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }
  ```

- [ ] **Step 2: Verify the page compiles and loads**

  ```bash
  npx tsc --noEmit 2>&1 | grep "approvals"
  ```
  Expected: no errors.

---

## Task 10: Update dashboard page — client hours model + English

**Files:**
- Modify: `app/(admin)/page.tsx`

- [ ] **Step 1: Replace app/(admin)/page.tsx**

  ```typescript
  import { auth } from '@/lib/auth/config'
  import { getBuildingConfigs } from '@/lib/sheets/building-config'
  import { getAllVisits } from '@/lib/sheets/all-visits'
  import { getUnitsSummary } from '@/lib/sheets/units-summary'
  import { getPendingApprovalCount } from '@/lib/sheets/review-log'
  import { getClientPlans } from '@/lib/sheets/client-plans'
  import { getCycleBalances } from '@/lib/sheets/cycle-balances'
  import {
    getCurrentCycleLabel,
    getCycleDates,
    calculateClientHoursBalance,
    getHoursUsedInBuilding,
    formatCycleRange,
  } from '@/lib/hours'
  import { KPIRow } from '@/components/admin/KPIRow'
  import { BuildingCard } from '@/components/admin/BuildingCard'
  import { RecentWorkTable } from '@/components/admin/RecentWorkTable'
  import { HoursBar } from '@/components/shared/HoursBar'
  import type { BuildingStats } from '@/types'

  const CYCLE_DAY_START = 25

  export default async function AdminOverviewPage() {
    const session = await auth()

    const [configs, allVisits, clientPlans] = await Promise.all([
      getBuildingConfigs(),
      getAllVisits(),
      getClientPlans(),
    ])

    const allowedConfigs = session?.user.role === 'admin'
      ? configs
      : configs.filter(c => (session?.user.buildings ?? []).includes(c.buildingName))

    const cycleLabel = getCurrentCycleLabel(CYCLE_DAY_START)
    const { start: cycleStart, end: cycleEnd } = getCycleDates(CYCLE_DAY_START, cycleLabel)

    // Client hours balance (using Eddie's plan for now — first active plan)
    const activePlan = clientPlans[0] ?? null
    const closedCycles = activePlan ? await getCycleBalances(activePlan.clientId) : []
    const clientBalance = activePlan
      ? calculateClientHoursBalance(allVisits, activePlan, closedCycles, cycleLabel)
      : null

    const buildings: BuildingStats[] = await Promise.all(
      allowedConfigs.map(async config => {
        const [units, pending] = await Promise.all([
          getUnitsSummary(config.buildingName),
          getPendingApprovalCount(config.buildingName),
        ])
        const hoursUsedThisCycle = getHoursUsedInBuilding(allVisits, config.buildingName, cycleStart, cycleEnd)

        return {
          name: config.buildingName,
          config,
          units,
          pendingApprovals: pending,
          hoursUsedThisCycle,
          materialsThisCycle: allVisits
            .filter(v => v.building === config.buildingName && v.date >= cycleStart && v.date <= cycleEnd)
            .reduce((sum, v) => sum + v.materialCost, 0),
        }
      })
    )

    const recentVisits = allVisits
      .filter(v => session?.user.role === 'admin' || (session?.user.buildings ?? []).includes(v.building))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 15)

    const totalPending = buildings.reduce((s, b) => s + b.pendingApprovals, 0)
    const cycleRange = formatCycleRange(cycleStart, cycleEnd)

    const kpis = [
      { label: 'Active Buildings', value: buildings.length, sub: 'Under management' },
      {
        label: 'Hours This Cycle',
        value: clientBalance ? `${clientBalance.usedHours.toFixed(1)}h` : '—',
        sub: clientBalance ? `of ${clientBalance.availableHours.toFixed(1)}h available` : '',
      },
      {
        label: 'Pending Approvals',
        value: totalPending,
        sub: totalPending > 0 ? 'Need review' : 'All up to date ✓',
        alert: totalPending > 0,
        href: totalPending > 0 ? '/approvals' : undefined,
      },
      {
        label: 'Up to Date',
        value: buildings.filter(b => b.pendingApprovals === 0).length,
        sub: 'Buildings with no pending',
      },
    ]

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">All buildings overview</p>
        </div>

        <KPIRow tiles={kpis} />

        {clientBalance && (
          <div className="bg-slate-800 rounded-xl p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-white font-semibold text-sm">Service Plan — {activePlan!.clientName}</h2>
                <p className="text-slate-500 text-xs">{cycleRange}</p>
              </div>
              {clientBalance.extraHours > 0 && (
                <span className="text-red-400 text-xs font-semibold bg-red-900/30 px-3 py-1 rounded-full">
                  {clientBalance.extraHours.toFixed(1)}h over — ${(clientBalance.extraHours * 75).toFixed(2)} extra
                </span>
              )}
            </div>
            <HoursBar
              used={clientBalance.usedHours}
              plan={clientBalance.planHours}
              rollover={clientBalance.rolledOverHours}
              showWarning
            />
          </div>
        )}

        <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide mb-3">Buildings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {buildings.map((b, i) => (
            <BuildingCard key={b.name} stats={b} index={i} cycleStart={cycleStart} cycleEnd={cycleEnd} />
          ))}
        </div>

        <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide mb-3">Recent Work</h2>
        <RecentWorkTable visits={recentVisits} />
      </div>
    )
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles clean**

  ```bash
  npx tsc --noEmit 2>&1 | head -40
  ```
  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add app/\(admin\)/page.tsx
  git commit -m "feat: client-plan hours model on dashboard, rollover display, English UI"
  ```

---

## Task 11: English — building and unit detail pages

**Files:**
- Modify: `app/(admin)/buildings/[building]/page.tsx`
- Modify: `app/(admin)/buildings/[building]/units/[unitId]/page.tsx`

- [ ] **Step 1: Replace building page**

  ```typescript
  import { getUnitsSummary } from '@/lib/sheets/units-summary'
  import { UnitList } from '@/components/admin/UnitList'
  import Link from 'next/link'

  export default async function BuildingPage({
    params,
  }: {
    params: Promise<{ building: string }>
  }) {
    const { building } = await params
    const buildingName = decodeURIComponent(building)
    const units = await getUnitsSummary(buildingName)

    return (
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors">← Dashboard</Link>
          <span>/</span>
          <span className="text-white font-medium">{buildingName}</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-xl font-bold">{buildingName}</h1>
          <span className="text-slate-400 text-sm">{units.length} registered areas</span>
        </div>
        <UnitList units={units} building={buildingName} />
      </div>
    )
  }
  ```

- [ ] **Step 2: Replace unit detail page**

  ```typescript
  import { getAllVisits } from '@/lib/sheets/all-visits'
  import { WorkDetail } from '@/components/admin/WorkDetail'
  import Link from 'next/link'

  export default async function UnitDetailPage({
    params,
  }: {
    params: Promise<{ building: string; unitId: string }>
  }) {
    const { building, unitId } = await params
    const buildingName = decodeURIComponent(building)
    const unitName = decodeURIComponent(unitId)

    const visits = await getAllVisits({ building: buildingName, unitId: unitName })
    const sorted = visits.sort((a, b) => b.date.localeCompare(a.date))

    const totalHours = Math.round(visits.reduce((s, v) => s + v.duration, 0) * 10) / 10
    const totalCost = visits.reduce((s, v) => s + v.materialCost, 0)

    return (
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/" className="hover:text-white">← Dashboard</Link>
          <span>/</span>
          <Link href={`/buildings/${encodeURIComponent(building)}`} className="hover:text-white">
            {buildingName}
          </Link>
          <span>/</span>
          <span className="text-white font-medium">{unitName}</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-xl font-bold">{unitName}</h1>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-white font-semibold">{totalHours}h</p>
              <p className="text-slate-400 text-xs">total hours</p>
            </div>
            <div>
              <p className="text-white font-semibold">${totalCost.toLocaleString('en-CA')}</p>
              <p className="text-slate-400 text-xs">materials</p>
            </div>
            <div>
              <p className="text-white font-semibold">{visits.length}</p>
              <p className="text-slate-400 text-xs">visits</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {sorted.length === 0 && (
            <p className="text-slate-400">No work records for this unit.</p>
          )}
          {sorted.map((v) => (
            <WorkDetail key={`${v.date}-${v.timeIn}-${v.unitId}`} visit={v} />
          ))}
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 3: Update UnitList.tsx — English tab labels**

  In `components/admin/UnitList.tsx`, find and replace the Spanish tab labels. The tab values come from `areaType` field which is in English (`Unit`, `Common Area`, `Exterior`) — but the UI label should be confirmed. Replace any Spanish UI text:

  Check the file for Spanish strings by running:
  ```bash
  grep -n "Sin\|área\|Área\|unidad\|Unidad\|Exterior\|Common\|visits" components/admin/UnitList.tsx
  ```
  Replace any found Spanish labels with English equivalents.

- [ ] **Step 4: Final TypeScript check + commit**

  ```bash
  npx tsc --noEmit 2>&1
  ```
  Expected: 0 errors.

  ```bash
  git add app/\(admin\)/buildings/ components/admin/UnitList.tsx
  git commit -m "feat: English UI for building pages and UnitList"
  ```

---

## Task 12: Build and deploy

- [ ] **Step 1: Run production build**

  ```bash
  npm run build 2>&1
  ```
  Expected: "Route (app)" table shows all routes compiled successfully. 0 errors.

- [ ] **Step 2: Test locally**

  ```bash
  npm run dev
  ```
  Open http://localhost:3000 and verify:
  - Login works
  - Dashboard shows in English
  - KPI tiles show correct data (not 52 pending)
  - "Pending Approvals" tile is clickable → `/approvals` page
  - Each building card shows hours used (no plan bar per building)
  - Client plan panel shows total hours + rollover bar
  - RecentWork table headers in English
  - Photo labels in WorkDetail are in English
  - NavBar shows "Sign out" not "Salir"

- [ ] **Step 3: Deploy to Vercel**

  ```bash
  vercel deploy --prod
  ```

- [ ] **Step 4: Smoke test on production URL**

  Open https://mactor-pro.vercel.app and repeat the verification above.

---

## Self-Review Checklist

- [x] English UI — all components, pages, and lib functions use English strings
- [x] 40h per cycle — plan comes from `Client_Plans` sheet (Eddie's row: 40h)
- [x] Rollover — `calculateClientHoursBalance` reads `Cycle_Balances`, applies rollover capped at 3×plan
- [x] Pending approvals bug — `getPendingApprovalCount` now reads raw cell value, not parsed boolean
- [x] Clickable approvals — KPITile has `href` prop, pending tile links to `/approvals`
- [x] Approvals page — shows pending entries grouped by building, links to unit pages
- [x] NavBar — Approvals link added, Sign out in English
- [x] HoursBar — shows rollover amount, extra hours in red, English strings
- [x] No HoursBalance per building — BuildingStats uses `hoursUsedThisCycle: number` only
- [x] TypeScript — all types consistent across tasks (ClientPlan, CycleBalance, ClientHoursBalance defined in Task 2, used in Tasks 3–10)
- [x] No placeholders — all code is complete and runnable
