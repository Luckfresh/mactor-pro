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
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-slate-700">← Dashboard</Link>
        <span>/</span>
        <Link href={`/buildings/${encodeURIComponent(building)}`} className="hover:text-slate-700">
          {buildingName}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{unitName}</span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-slate-900 text-xl font-bold">{unitName}</h1>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-slate-900 font-semibold">{totalHours}h</p>
            <p className="text-slate-500 text-xs">total hours</p>
          </div>
          <div>
            <p className="text-slate-900 font-semibold">${totalCost.toLocaleString('en-CA')}</p>
            <p className="text-slate-500 text-xs">materials</p>
          </div>
          <div>
            <p className="text-slate-900 font-semibold">{visits.length}</p>
            <p className="text-slate-500 text-xs">visits</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {sorted.length === 0 && (
          <p className="text-slate-500">No work records for this unit.</p>
        )}
        {sorted.map((v) => (
          <WorkDetail key={`${v.date}-${v.timeIn}-${v.unitId}`} visit={v} />
        ))}
      </div>
    </div>
  )
}
