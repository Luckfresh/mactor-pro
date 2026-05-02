import { auth } from '@/lib/auth/config'
import { getReviewLog } from '@/lib/sheets/review-log'
import { formatDate, getCurrentCycleLabel } from '@/lib/hours'
import Link from 'next/link'

const CYCLE_DAY_START = 25

const BUILDING_COLOR: Record<string, string> = {
  'PHASE I 72 Isabella': 'bg-blue-900/50 text-blue-300',
  'PHASE II Church': 'bg-green-900/50 text-green-300',
  'PHASE III Wellesley': 'bg-amber-900/50 text-amber-300',
}

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
          {pending.length} {pending.length === 1 ? 'item' : 'items'} awaiting review
        </p>
      </div>

      {pending.length === 0 && (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-green-400 text-lg font-semibold">All up to date ✓</p>
          <p className="text-slate-400 text-sm mt-1">No pending approvals across any building.</p>
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
            <div className="grid grid-cols-[100px_1fr_150px_80px_80px] gap-2 px-4 py-2 text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
              <span>Date</span>
              <span>Unit / Work</span>
              <span>Type</span>
              <span>Hours</span>
              <span>Cycle</span>
            </div>
            {entries.map((entry, i) => (
              <Link
                key={i}
                href={`/buildings/${encodeURIComponent(building)}/units/${encodeURIComponent(entry.unitId)}`}
                className="grid grid-cols-[100px_1fr_150px_80px_80px] gap-2 px-4 py-3 text-sm border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50 transition-colors"
              >
                <span className="text-slate-400 text-xs">{formatDate(entry.date)}</span>
                <div>
                  <p className="text-white text-xs font-medium">{entry.areaName || entry.unitId}</p>
                  <p className="text-slate-500 text-xs truncate">{entry.workPerformed}</p>
                </div>
                <span className="text-slate-300 text-xs">{entry.visitType}</span>
                <span className="text-white text-xs">{entry.duration.toFixed(1)}h</span>
                <span className="text-slate-400 text-xs">{entry.cycleLabel}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
