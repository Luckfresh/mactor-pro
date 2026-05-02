import { auth } from '@/lib/auth/config'
import { getReviewLog } from '@/lib/sheets/review-log'
import { getWorkOrders } from '@/lib/sheets/work-orders'
import { formatDate, getCurrentCycleLabel } from '@/lib/hours'
import { ApprovalActions } from '@/components/admin/ApprovalActions'
import { WorkOrderActions } from '@/components/admin/WorkOrderActions'

const CYCLE_DAY_START = 25

export default async function ApprovalsPage() {
  const session = await auth()
  const role = (session?.user.role ?? 'manager') as 'admin' | 'manager'

  const cycleLabel = getCurrentCycleLabel(CYCLE_DAY_START)
  const [allPending, allWOs] = await Promise.all([
    getReviewLog({ approved: false, cycleLabel }),
    getWorkOrders({ status: 'Reported' }),
  ])

  const pending = role === 'admin'
    ? allPending
    : allPending.filter(e => (session?.user.buildings ?? []).includes(e.building))

  const reportedWOs = role === 'admin'
    ? allWOs
    : allWOs.filter(wo => (session?.user.buildings ?? []).includes(wo.building))

  const totalPending = pending.length + reportedWOs.length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-slate-900 text-2xl font-bold">Approvals</h1>
        <p className="text-slate-500 text-sm mt-1">
          {totalPending} pending
        </p>
      </div>

      {totalPending === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
          <p className="text-green-600 font-semibold text-base">All caught up ✓</p>
          <p className="text-slate-500 text-sm mt-1">No pending approvals.</p>
        </div>
      ) : (
        <>
          {/* Reported work orders from inspections */}
          {reportedWOs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Inspection Issues — Awaiting Approval ({reportedWOs.length})
                </h2>
              </div>
              {reportedWOs.map(wo => (
                <div key={wo.id} className="px-5 py-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-slate-900 text-sm font-semibold">{wo.areaName || wo.unitId}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500 text-xs">{wo.building.replace('PHASE ', 'P')}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500 text-xs">{wo.createdAt}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          wo.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>{wo.priority}</span>
                      </div>
                      <p className="text-slate-700 text-sm">{wo.description}</p>
                      <p className="text-slate-400 text-xs mt-1">Reported by {wo.createdBy}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <WorkOrderActions id={wo.id} status={wo.status} role={role} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Visit review log entries */}
          {pending.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Review — {cycleLabel}</h2>
              </div>
              {pending.map(entry => (
                <div key={entry.visitKey} className="px-5 py-4 border-b border-gray-100 last:border-0">
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
        </>
      )}
    </div>
  )
}
