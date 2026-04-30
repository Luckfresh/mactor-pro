import { KPIRow } from '@/components/admin/KPIRow'
import { BuildingCard } from '@/components/admin/BuildingCard'
import { RecentWorkTable } from '@/components/admin/RecentWorkTable'
import type { BuildingStats, Visit } from '@/types'

async function getBuildings(): Promise<BuildingStats[]> {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/buildings`, {
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

async function getRecentVisits(): Promise<Visit[]> {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/visits?limit=8`, {
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export default async function AdminOverviewPage() {
  const [buildings, recentVisits] = await Promise.all([
    getBuildings(),
    getRecentVisits(),
  ])

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

      <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide mb-3">
        Edificios
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {buildings.map((b, i) => (
          <BuildingCard key={b.name} stats={b} index={i} />
        ))}
      </div>

      <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide mb-3">
        Últimos trabajos
      </h2>
      <RecentWorkTable visits={recentVisits} />
    </div>
  )
}
