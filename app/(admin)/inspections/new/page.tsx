import { getUnitsSummary } from '@/lib/sheets/units-summary'
import { NewInspectionRequestForm } from '@/components/admin/NewInspectionRequestForm'
import Link from 'next/link'
import type { UnitSummary } from '@/types'

export default async function NewInspectionRequestPage() {
  const allUnits = await getUnitsSummary()

  const unitsByBuilding = allUnits.reduce<Record<string, UnitSummary[]>>((acc, u) => {
    if (!acc[u.building]) acc[u.building] = []
    acc[u.building].push(u)
    return acc
  }, {})

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/inspections" className="text-slate-400 text-sm hover:text-white">← Inspections</Link>
        <h1 className="text-white text-2xl font-bold mt-2">Request Inspection</h1>
        <p className="text-slate-400 text-sm mt-1">Julio will be notified and can start the inspection.</p>
      </div>
      <NewInspectionRequestForm unitsByBuilding={unitsByBuilding} />
    </div>
  )
}
