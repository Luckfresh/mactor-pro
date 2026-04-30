import { WorkDetail } from '@/components/admin/WorkDetail'
import Link from 'next/link'
import type { Visit } from '@/types'

async function getVisits(building: string, unitId: string): Promise<Visit[]> {
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/visits?building=${encodeURIComponent(building)}&unitId=${encodeURIComponent(unitId)}`,
    { cache: 'no-store' }
  )
  if (!res.ok) return []
  return res.json()
}

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ building: string; unitId: string }>
}) {
  const { building, unitId } = await params
  const buildingName = decodeURIComponent(building)
  const unitName = decodeURIComponent(unitId)
  const visits = await getVisits(buildingName, unitName)

  const totalHours = visits.reduce((s, v) => s + v.duration, 0)
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
            <p className="text-white font-semibold">{Math.round(totalHours * 10) / 10}h</p>
            <p className="text-slate-400 text-xs">total horas</p>
          </div>
          <div>
            <p className="text-white font-semibold">${totalCost.toLocaleString('en-CA')}</p>
            <p className="text-slate-400 text-xs">materiales</p>
          </div>
          <div>
            <p className="text-white font-semibold">{visits.length}</p>
            <p className="text-slate-400 text-xs">visitas</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {visits.length === 0 && (
          <p className="text-slate-400">Sin trabajos registrados para esta unidad.</p>
        )}
        {visits.map((v, i) => (
          <WorkDetail key={i} visit={v} />
        ))}
      </div>
    </div>
  )
}
