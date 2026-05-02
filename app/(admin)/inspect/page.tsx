import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { getInspectionRequests } from '@/lib/sheets/inspection-requests'
import { getUnitsSummary } from '@/lib/sheets/units-summary'
import { InspectionForm } from '@/components/admin/InspectionForm'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ requestId?: string }>
}

export default async function InspectPage({ searchParams }: Props) {
  const session = await auth()
  if (session?.user.role !== 'admin') redirect('/inspections')

  const { requestId } = await searchParams
  if (!requestId) redirect('/inspections')

  const requests = await getInspectionRequests({ status: 'In Progress' })
  const request = requests.find(r => r.requestId === requestId)
  if (!request) redirect('/inspections')

  const units = await getUnitsSummary(request.building)
  const unit = units.find(u => u.unitId === request.unitId) ?? null

  return (
    <div>
      <div className="mb-6">
        <Link href="/inspections" className="text-slate-400 text-sm hover:text-slate-600">← Inspections</Link>
        <h1 className="text-slate-900 text-2xl font-bold mt-2">Inspection</h1>
        <p className="text-slate-400 text-sm mt-1">
          {request.unitId} · {request.building.replace('PHASE ', 'Phase ')}
        </p>
      </div>
      <InspectionForm request={request} unit={unit} />
    </div>
  )
}
