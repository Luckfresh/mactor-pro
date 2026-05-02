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
          <Link href="/" className="text-slate-400 text-sm hover:text-white">← Dashboard</Link>
          <h1 className="text-white text-2xl font-bold mt-2">Inspections</h1>
          <p className="text-slate-400 text-sm mt-1">
            {active.filter(r => r.status === 'Pending').length} pending
            {isAdmin && active.some(r => r.status === 'In Progress')
              ? ` · ${active.filter(r => r.status === 'In Progress').length} in progress`
              : ''}
          </p>
        </div>
        <Link
          href="/inspections/new"
          className="bg-amber-500 text-slate-900 font-bold text-sm px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors"
        >
          + Request Inspection
        </Link>
      </div>

      {/* Active requests */}
      {active.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 text-center mb-6">
          <p className="text-green-400 font-semibold">All clear ✓</p>
          <p className="text-slate-400 text-sm mt-1">No pending inspection requests.</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl overflow-hidden mb-8">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">Pending & In Progress</h2>
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
        <div className="bg-slate-800 rounded-xl overflow-hidden opacity-80">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">Recent History</h2>
          </div>
          {history.map(r => (
            <div key={r.requestId} className="grid grid-cols-[1fr_90px_70px_80px] gap-2 px-4 py-3 border-b border-slate-700/50 last:border-0 items-center">
              <div>
                <p className="text-slate-300 text-xs font-medium">{r.areaName || r.unitId}</p>
                <p className="text-slate-500 text-xs">{r.building.replace('PHASE ', 'P')} · {r.date} · {r.requestedBy}</p>
              </div>
              <span className="text-slate-400 text-xs">{r.durationHours > 0 ? `${r.durationHours}h` : '—'}</span>
              <span className="text-slate-400 text-xs">{r.completedBy || '—'}</span>
              <span className={`text-xs font-medium ${r.status === 'Completed' ? 'text-green-400' : 'text-slate-500'}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
