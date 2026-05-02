import Link from 'next/link'
import type { BuildingStats } from '@/types'

const BUILDING_COLORS: Record<number, string> = {
  0: 'border-blue-500',
  1: 'border-green-500',
  2: 'border-amber-400',
}

interface BuildingCardProps {
  stats: BuildingStats
  index: number
  cycleStart: string
  cycleEnd: string
}

export function BuildingCard({ stats, index, cycleStart, cycleEnd }: BuildingCardProps) {
  const slug = encodeURIComponent(stats.name)

  return (
    <Link href={`/buildings/${slug}`} className="block">
      <div
        className={`bg-slate-800 rounded-xl p-5 border-l-4 ${BUILDING_COLORS[index % 3]} hover:bg-slate-700/80 transition-colors cursor-pointer`}
      >
        <h3 className="text-white font-semibold text-sm mb-3">{stats.name}</h3>
        <div className="grid grid-cols-2 gap-y-2 text-xs mb-3">
          <span className="text-slate-400">Areas / Units</span>
          <span className="text-white text-right">{stats.units.length}</span>
          <span className="text-slate-400">Hours this cycle</span>
          <span className="text-white text-right">{stats.hoursUsedThisCycle.toFixed(1)}h</span>
          <span className="text-slate-400">Materials</span>
          <span className="text-white text-right">
            ${stats.materialsThisCycle.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-slate-400">Approvals</span>
          <span className={`text-right font-semibold ${stats.pendingApprovals > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {stats.pendingApprovals > 0 ? `${stats.pendingApprovals} pending ⚠` : 'Up to date ✓'}
          </span>
        </div>
        <p className="text-slate-600 text-xs">Cycle: {cycleStart} – {cycleEnd}</p>
      </div>
    </Link>
  )
}
