import { getUnitsSummary } from '@/lib/sheets/units-summary'
import { ReportForm } from '@/components/tenant/ReportForm'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ building: string; unitId: string }>
}

export default async function TenantReportPage({ params }: Props) {
  const { building, unitId } = await params
  const decodedBuilding = decodeURIComponent(building)
  const decodedUnit = decodeURIComponent(unitId)

  const units = await getUnitsSummary(decodedBuilding)
  const unit = units.find(u => u.unitId === decodedUnit) ?? null

  if (!unit && units.length === 0) notFound()

  return (
    <div>
      <h1 className="text-gray-900 text-2xl font-bold mb-1">Report an issue</h1>
      <p className="text-gray-500 text-sm mb-8">
        Submit a maintenance request — your building manager will review it.
      </p>
      <ReportForm
        building={decodedBuilding}
        unitId={decodedUnit}
        areaName={unit?.areaName ?? decodedUnit}
      />
    </div>
  )
}
