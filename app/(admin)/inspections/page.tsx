import { auth } from '@/lib/auth/config'
import { getInspectionRequests } from '@/lib/sheets/inspection-requests'
import { getInspections } from '@/lib/sheets/inspections'
import { InspectionRequestCard } from '@/components/admin/InspectionRequestCard'
import Link from 'next/link'

const STATUS_ORDER: Record<string, number> = { Pending: 0, 'In Progress': 1, Completed: 2, Cancelled: 3 }

export default async function InspectionsPage() {
  const session = await auth()
  const isAdmin = session?.user.role === 'admin'

  const [allRequests, pastInspections] = await Promise.all([
    getInspectionRequests(),
    getInspections({ limit: 60 }),
  ])

  const visible = isAdmin
    ? allRequests
    : allRequests.filter(r => (session?.user.buildings ?? []).includes(r.building))

  const active = visible.filter(r => r.status === 'Pending' || r.status === 'In Progress')
  const history = visible.filter(r => r.status === 'Completed' || r.status === 'Cancelled').slice(0, 50)

  const visiblePast = isAdmin
    ? pastInspections
    : pastInspections.filter(r => (session?.user.buildings ?? []).includes(r.building))

  const pendingCount = active.filter(r => r.status === 'Pending').length
  const inProgressCount = active.filter(r => r.status === 'In Progress').length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl font-bold">Inspections</h1>
          <p className="text-slate-500 text-sm mt-1">
            {pendingCount > 0 ? `${pendingCount} pending` : 'No pending requests'}
            {inProgressCount > 0 ? ` · ${inProgressCount} in progress` : ''}
            {history.length > 0 ? ` · ${history.length} completed` : ''}
          </p>
        </div>
        {isAdmin ? (
          <Link
            href="/inspections/start"
            className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            ▶ Start Inspection
          </Link>
        ) : (
          <Link
            href="/inspections/new"
            className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            + Request Inspection
          </Link>
        )}
      </div>

      {/* Active requests (pending + in progress) */}
      {active.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending &amp; In Progress</h2>
          </div>
          {active
            .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))
            .map(r => (
              <InspectionRequestCard key={r.requestId} request={r} isAdmin={isAdmin} />
            ))}
        </div>
      )}

      {active.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center mb-6">
          <p className="text-green-600 font-semibold">All clear ✓</p>
          <p className="text-slate-500 text-sm mt-1">No pending inspection requests.</p>
        </div>
      )}

      {/* Completed history */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Completed Inspections ({history.length})
            </h2>
          </div>
          {history.map(r => (
            <div key={r.requestId} className="grid grid-cols-[1fr_80px_90px_80px] gap-3 px-5 py-3.5 border-b border-gray-100 last:border-0 items-center hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-slate-900 text-sm font-medium">{r.areaName || r.unitId}</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {r.building.replace('PHASE ', 'P')} · {r.date}
                  {r.requestedBy ? ` · by ${r.requestedBy}` : ''}
                </p>
              </div>
              <span className="text-slate-500 text-xs">{r.durationHours > 0 ? `${r.durationHours}h` : '—'}</span>
              <span className="text-slate-500 text-xs truncate">{r.completedBy || '—'}</span>
              <span className={`text-xs font-semibold ${
                r.status === 'Completed' ? 'text-green-600' : 'text-slate-400'
              }`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Past completed inspections from the Inspections sheet */}
      {visiblePast.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Inspection Records ({visiblePast.length})
            </h2>
          </div>
          {visiblePast.map(r => (
            <div key={r.id} className="grid grid-cols-[1fr_90px_100px_80px_80px] gap-3 px-5 py-3.5 border-b border-gray-100 last:border-0 items-center hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-slate-900 text-sm font-medium">{r.areaName || r.unitId}</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {r.building.replace('PHASE ', 'P')} · {r.date}
                </p>
              </div>
              <span className="text-slate-500 text-xs">{r.technician || '—'}</span>
              <span className="text-slate-500 text-xs truncate">{r.cycleLabel || '—'}</span>
              <span className={`text-xs font-semibold ${r.urgentIssues > 0 ? 'text-red-600' : r.totalIssues > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {r.totalIssues === 0 ? '✓ OK' : `${r.totalIssues} issue${r.totalIssues !== 1 ? 's' : ''}`}
              </span>
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold text-center">
                Done
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
