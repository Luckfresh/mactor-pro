import { UnitList } from '@/components/admin/UnitList'
import Link from 'next/link'
import type { UnitSummary } from '@/types'

async function getUnits(building: string): Promise<UnitSummary[]> {
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/units?building=${encodeURIComponent(building)}`,
    { cache: 'no-store' }
  )
  if (!res.ok) return []
  return res.json()
}

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ building: string }>
}) {
  const { building } = await params
  const buildingName = decodeURIComponent(building)
  const units = await getUnits(buildingName)

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-white transition-colors">← Dashboard</Link>
        <span>/</span>
        <span className="text-white font-medium">{buildingName}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-bold">{buildingName}</h1>
        <span className="text-slate-400 text-sm">{units.length} áreas registradas</span>
      </div>

      <UnitList units={units} building={buildingName} />
    </div>
  )
}
