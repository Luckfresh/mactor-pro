import Link from 'next/link'
import type { BuildingStats } from '@/types'

const ACCENT: Record<number, string> = {
  0: 'border-l-indigo-500',
  1: 'border-l-sky-500',
  2: 'border-l-violet-500',
}

interface BuildingCardProps {
  stats: BuildingStats
  index: number
}

export function BuildingCard({ stats, index }: BuildingCardProps) {
  const slug = encodeURIComponent(stats.name)
  const shortName = stats.name.replace(/^PHASE (I{1,3}|IV) /i, '')
  const parts = stats.name.split(' ')
  const prefix = parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0]

  return (
    <Link href={`/buildings/${slug}`} className="block group">
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm border-l-4 ${ACCENT[index % 3]} hover:shadow-md hover:border-gray-300 transition-all`}>
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-slate-900 font-bold text-sm">{shortName}</h3>
          <p className="text-slate-500 text-xs mt-0.5">{prefix} · {stats.units.length} units</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-y-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Hours</p>
            <p className="text-xl font-extrabold text-indigo-600 tracking-tight">{stats.hoursUsedThisCycle.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Materials</p>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              ${stats.materialsThisCycle.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <div className="px-5 pb-4 flex items-center justify-between">
          {stats.pendingApprovals > 0 ? (
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
              {stats.pendingApprovals} pending approval{stats.pendingApprovals !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
              All clear ✓
            </span>
          )}
          <span className="text-slate-400 text-xs group-hover:text-slate-600 transition-colors">→</span>
        </div>
      </div>
    </Link>
  )
}
