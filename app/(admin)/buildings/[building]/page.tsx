import { getUnitsSummary } from '@/lib/sheets/units-summary'
import { getAllVisits } from '@/lib/sheets/all-visits'
import { UnitList } from '@/components/admin/UnitList'
import Link from 'next/link'

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ building: string }>
}) {
  const { building } = await params
  const buildingName = decodeURIComponent(building)

  const [units, visits] = await Promise.all([
    getUnitsSummary(buildingName),
    getAllVisits({ building: buildingName }),
  ])

  // Group visits by unitId
  const visitsByUnit: Record<string, typeof visits> = {}
  for (const v of visits) {
    if (!visitsByUnit[v.unitId]) visitsByUnit[v.unitId] = []
    visitsByUnit[v.unitId].push(v)
  }

  // Override summary totals with values computed from real visit records
  const enrichedUnits = units.map(u => {
    const uVisits = visitsByUnit[u.unitId] ?? []
    const sorted = [...uVisits].sort((a, b) => b.date.localeCompare(a.date))
    return {
      ...u,
      totalVisits: uVisits.length,
      totalHours: Math.round(uVisits.reduce((s, v) => s + v.duration, 0) * 10) / 10,
      totalMaterialCost: uVisits.reduce((s, v) => s + v.materialCost, 0),
      lastVisit: sorted[0]?.date ?? u.lastVisit,
    }
  })

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-slate-700 transition-colors">← Dashboard</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{buildingName}</span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-slate-900 text-xl font-bold">{buildingName}</h1>
        <span className="text-slate-500 text-sm">{units.length} registered areas</span>
      </div>
      <UnitList units={enrichedUnits} building={buildingName} />
    </div>
  )
}
