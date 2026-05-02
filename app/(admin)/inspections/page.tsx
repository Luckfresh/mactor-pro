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
  const history = visible.filter(r => r.status === 'Completed' || r.status === 'Cancelled').slice(0, 40)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl font-bold">Inspections</h1>
          <p className="text-slate-500 text-sm mt-1">
            {active.filter(r => r.status === 'Pending').length} pending
            {isAdmin && active.some(r => r.status === 'In Progress')
              ? ` · ${active.filter(r => r.status === 'In Progress').length} in progress`
              : ''}
          </p>
        </div>
        <Link
          href="/inspections/new"
          className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Request Inspection
        </Link>
      </div>

      {/* Active requests */}
      {active.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center mb-6">
          <p className="text-green-600 font-semibold">All clear ✓</p>
          <p className="text-slate-500 text-sm mt-1">No pending inspection requests.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
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

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden opacity-75">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent History</h2>
          </div>
          {history.map(r => (
            <div key={r.requestId} className="grid grid-cols-[1fr_90px_70px_80px] gap-2 px-5 py-3 border-b border-gray-100 last:border-0 items-center">
              <div>
                <p className="text-slate-700 text-xs font-medium">{r.areaName || r.unitId}</p>
                <p className="text-slate-500 text-xs">{r.building.replace('PHASE ', 'P')} · {r.date} · {r.requestedBy}</p>
              </div>
              <span className="text-slate-500 text-xs">{r.durationHours > 0 ? `${r.durationHours}h` : '—'}</span>
              <span className="text-slate-500 text-xs">{r.completedBy || '—'}</span>
              <span className={`text-xs font-medium ${r.status === 'Completed' ? 'text-green-600' : 'text-slate-500'}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
