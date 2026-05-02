import { auth } from '@/lib/auth/config'
import { getReviewLog } from '@/lib/sheets/review-log'
import { formatDate, getCurrentCycleLabel } from '@/lib/hours'
import { ApprovalActions } from '@/components/admin/ApprovalActions'

const CYCLE_DAY_START = 25

export default async function ApprovalsPage() {
  const session = await auth()

  const cycleLabel = getCurrentCycleLabel(CYCLE_DAY_START)
  const allPending = await getReviewLog({ approved: false, cycleLabel })
  const pending = session?.user.role === 'admin'
    ? allPending
    : allPending.filter(e => (session?.user.buildings ?? []).includes(e.building))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-slate-900 text-2xl font-bold">Approvals</h1>
        <p className="text-slate-500 text-sm mt-1">
          {pending.length} pending this cycle
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
          <p className="text-green-600 font-semibold text-base">All caught up ✓</p>
          <p className="text-slate-500 text-sm mt-1">No pending approvals this cycle.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Review — {cycleLabel}</h2>
          </div>
          {pending.map((entry, i) => (
            <div key={entry.visitKey ?? i} className="px-5 py-4 border-b border-gray-100 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-slate-900 text-sm font-semibold">{entry.areaName || entry.unitId}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 text-xs">{entry.building.replace('PHASE ', 'P')}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 text-xs">{formatDate(entry.date)}</span>
                  </div>
                  <p className="text-slate-700 text-sm">{entry.workPerformed || entry.visitType}</p>
                  <p className="text-slate-400 text-xs mt-1">{entry.technician} · {entry.duration.toFixed(1)}h</p>
                </div>
                <div className="flex-shrink-0">
                  <ApprovalActions visitKey={entry.visitKey} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
