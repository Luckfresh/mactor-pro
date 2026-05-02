import { auth } from '@/lib/auth/config'
import { getInspectionRequests } from '@/lib/sheets/inspection-requests'
import { InspectionRequestCard } from '@/components/admin/InspectionRequestCard'
import Link from 'next/link'

const STATUS_ORDER: Record<string, number> = { Pending: 0, 'In Progress': 1, Completed: 2, Cancelled: 3 }

export default async function InspectionsPage() {
  const session = await auth()
  const isAdmin = session?.user.role === 'admin'

  const allRequests = await getInspectionRequests()

  const visible = isAdmin
    ? allRequests
    : allRequests.filter(r => (session?.user.buildings ?? []).includes(r.building))

  const active = visible.filter(r => r.status === 'Pending' || r.status === 'In Progress')
  const history = visible.filter(r => r.status === 'Completed' || r.status === 'Cancelled').slice(0, 50)

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

      {history.length === 0 && active.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center opacity-75">
          <p className="text-slate-500 text-sm">No completed inspections yet.</p>
        </div>
      )}
    </div>
  )
}
