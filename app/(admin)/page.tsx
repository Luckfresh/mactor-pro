import { auth } from '@/lib/auth/config'
import { getBuildingConfigs } from '@/lib/sheets/building-config'
import { getAllVisits } from '@/lib/sheets/all-visits'
import { getUnitsSummary } from '@/lib/sheets/units-summary'
import { getPendingApprovalCount } from '@/lib/sheets/review-log'
import { getPendingInspectionCount } from '@/lib/sheets/inspection-requests'
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

  const activePlan = clientPlans[0] ?? null
  const closedCycles = activePlan ? await getCycleBalances(activePlan.clientId) : []
  const clientBalance = activePlan
    ? calculateClientHoursBalance(allVisits, activePlan, closedCycles, cycleLabel)
    : null

  const totalPendingInspections = await getPendingInspectionCount()

  const buildings: BuildingStats[] = await Promise.all(
    allowedConfigs.map(async config => {
      const [units, pending] = await Promise.all([
        getUnitsSummary(config.buildingName),
        getPendingApprovalCount(config.buildingName, cycleLabel),
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
      label: 'Pending Inspections',
      value: totalPendingInspections,
      sub: totalPendingInspections > 0 ? 'Awaiting start' : 'None pending ✓',
      warn: totalPendingInspections > 0,
      href: totalPendingInspections > 0 ? '/inspections' : undefined,
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-slate-900 text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">All buildings overview</p>
      </div>

      <KPIRow tiles={kpis} />

      {clientBalance && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-slate-900 font-semibold text-sm">Service Plan — {activePlan!.clientName}</h2>
              <p className="text-slate-500 text-xs">{cycleRange}</p>
            </div>
            {clientBalance.extraHours > 0 && (
              <span className="text-red-700 text-xs font-semibold bg-red-50 border border-red-200 px-3 py-1 rounded-full">
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

      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Buildings</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {buildings.map((b, i) => (
          <BuildingCard key={b.name} stats={b} index={i} cycleStart={cycleStart} cycleEnd={cycleEnd} />
        ))}
      </div>

      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Recent Work</h2>
      <RecentWorkTable visits={recentVisits} />
    </div>
  )
}
