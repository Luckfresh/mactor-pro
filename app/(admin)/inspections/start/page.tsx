import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { getUnitsSummary } from '@/lib/sheets/units-summary'
import { StartInspectionForm } from '@/components/admin/StartInspectionForm'
import Link from 'next/link'
import type { UnitSummary } from '@/types'

export default async function StartInspectionPage() {
  const session = await auth()
  if (session?.user.role !== 'admin') redirect('/inspections')

  const allUnits = await getUnitsSummary()

  const unitsByBuilding = allUnits.reduce<Record<string, UnitSummary[]>>((acc, u) => {
    if (!acc[u.building]) acc[u.building] = []
    acc[u.building].push(u)
    return acc
  }, {})

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/inspections" className="text-slate-500 text-sm hover:text-slate-700">← Inspections</Link>
        <h1 className="text-slate-900 text-2xl font-bold mt-2">Start Inspection</h1>
        <p className="text-slate-500 text-sm mt-1">Select a building and unit to begin the inspection form.</p>
      </div>
      <StartInspectionForm unitsByBuilding={unitsByBuilding} />
    </div>
  )
}
