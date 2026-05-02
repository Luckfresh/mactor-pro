import { auth } from '@/lib/auth/config'
import { getReviewLog } from '@/lib/sheets/review-log'
import { formatDate, getCurrentCycleLabel } from '@/lib/hours'
import { ApprovalActions } from '@/components/admin/ApprovalActions'
import Link from 'next/link'

const CYCLE_DAY_START = 25

export default async function ApprovalsPage() {
  const session = await auth()

  const cycleLabel = getCurrentCycleLabel(CYCLE_DAY_START)
  const allPending = await getReviewLog({ approved: false, cycleLabel })
  const pending = session?.user.role === 'admin'
    ? allPending
    : allPending.filter(e => (session?.user.buildings ?? []).includes(e.building))

  const grouped = pending.reduce<Record<string, typeof pending>>((acc, entry) => {
    if (!acc[entry.building]) acc[entry.building] = []
    acc[entry.building].push(entry)
    return acc
  }, {})

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-slate-400 text-sm hover:text-white">← Dashboard</Link>
        <h1 className="text-white text-2xl font-bold mt-2">Pending Approvals</h1>
        <p className="text-slate-400 text-sm mt-1">
          {pending.length} {pending.length === 1 ? 'item' : 'items'} awaiting review · Cycle {cycleLabel}
        </p>
      </div>

      {pending.length === 0 && (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-green-400 text-lg font-semibold">All up to date ✓</p>
          <p className="text-slate-400 text-sm mt-1">No pending approvals for cycle {cycleLabel}.</p>
        </div>
      )}

      {Object.entries(grouped).map(([building, entries]) => (
        <div key={building} className="mb-6">
          <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide mb-3">
            {building}
            <span className="ml-2 text-red-400 font-normal normal-case">
              {entries.length} pending
            </span>
          </h2>
          <div className="bg-slate-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[100px_1fr_150px_70px_180px] gap-2 px-4 py-2 text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
              <span>Date</span>
              <span>Unit / Work</span>
              <span>Type</span>
              <span>Hours</span>
              <span>Action</span>
            </div>
            {entries.map((entry, i) => (
              <div
                key={i}
                className="grid grid-cols-[100px_1fr_150px_70px_180px] gap-2 px-4 py-3 text-sm border-b border-slate-700/50 last:border-0 items-start"
              >
                <span className="text-slate-400 text-xs pt-1">{formatDate(entry.date)}</span>
                <div>
                  <Link
                    href={`/buildings/${encodeURIComponent(building)}/units/${encodeURIComponent(entry.unitId)}`}
                    className="text-white text-xs font-medium hover:text-amber-400 transition-colors"
                  >
                    {entry.areaName || entry.unitId}
                  </Link>
                  <p className="text-slate-500 text-xs truncate">{entry.workPerformed}</p>
                  {entry.technician && (
                    <p className="text-slate-600 text-xs">{entry.technician}</p>
                  )}
                </div>
                <span className="text-slate-300 text-xs pt-1">{entry.visitType}</span>
                <span className="text-white text-xs pt-1">{entry.duration.toFixed(1)}h</span>
                <ApprovalActions visitKey={entry.visitKey} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
