import { auth } from '@/lib/auth/config'
import { getBuildingConfigs } from '@/lib/sheets/building-config'
import { getAllVisits } from '@/lib/sheets/all-visits'
import { getUnitsSummary } from '@/lib/sheets/units-summary'
import { getPendingApprovalCount } from '@/lib/sheets/review-log'
import { getCurrentCycleLabel, calculateHoursBalance } from '@/lib/hours'
import { KPIRow } from '@/components/admin/KPIRow'
import { BuildingCard } from '@/components/admin/BuildingCard'
import { RecentWorkTable } from '@/components/admin/RecentWorkTable'
import type { BuildingStats } from '@/types'

export default async function AdminOverviewPage() {
  const session = await auth()

  const configs = await getBuildingConfigs()
  const allowedConfigs = session?.user.role === 'admin'
    ? configs
    : configs.filter(c => (session?.user.buildings ?? []).includes(c.buildingName))

  const allVisits = await getAllVisits()

  const buildings: BuildingStats[] = await Promise.all(
    allowedConfigs.map(async config => {
      const units = await getUnitsSummary(config.buildingName)
      const pending = await getPendingApprovalCount(config.buildingName)
      const cycleLabel = getCurrentCycleLabel(config)
      const hoursBalance = calculateHoursBalance(allVisits, config, cycleLabel)

      return {
        name: config.buildingName,
        config,
        units,
        pendingApprovals: pending,
        hoursBalance,
        materialsThisCycle: allVisits
          .filter(v => v.building === config.buildingName && v.date >= hoursBalance.cycleStart)
          .reduce((sum, v) => sum + v.materialCost, 0),
      }
    })
  )

  // Recent visits: last 8 visits across allowed buildings
  const recentVisits = allVisits
    .filter(v => session?.user.role === 'admin' || (session?.user.buildings ?? []).includes(v.building))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)

  const totalPending = buildings.reduce((s, b) => s + b.pendingApprovals, 0)
  const totalHours = buildings.reduce((s, b) => s + b.hoursBalance.usedHours, 0)

  const kpis = [
    { label: 'Edificios activos', value: buildings.length, sub: 'GTA' },
    { label: 'Horas este ciclo', value: `${Math.round(totalHours * 10) / 10}h`, sub: 'Acumulado' },
    {
      label: 'Aprobaciones pendientes',
      value: totalPending,
      sub: totalPending > 0 ? 'Requieren revisión' : 'Al día ✓',
      alert: totalPending > 0,
    },
    {
      label: 'Sin pendientes',
      value: buildings.filter(b => b.pendingApprovals === 0).length,
      sub: 'Edificios al día',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Vista general de todos los edificios</p>
      </div>
      <KPIRow tiles={kpis} />
      <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide mb-3">Edificios</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {buildings.map((b, i) => (
          <BuildingCard key={b.name} stats={b} index={i} />
        ))}
      </div>
      <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide mb-3">Últimos trabajos</h2>
      <RecentWorkTable visits={recentVisits} />
    </div>
  )
}
