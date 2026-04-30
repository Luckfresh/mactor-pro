import Link from 'next/link'
import { HoursBar } from '@/components/shared/HoursBar'
import type { BuildingStats } from '@/types'

const BUILDING_COLORS: Record<number, string> = {
  0: 'border-blue-500',
  1: 'border-green-500',
  2: 'border-amber-400',
}

interface BuildingCardProps {
  stats: BuildingStats
  index: number
}

export function BuildingCard({ stats, index }: BuildingCardProps) {
  const slug = encodeURIComponent(stats.name)
  const { hoursBalance } = stats

  return (
    <Link href={`/buildings/${slug}`} className="block">
      <div
        className={`bg-slate-800 rounded-xl p-5 border-l-4 ${BUILDING_COLORS[index % 3]} hover:bg-slate-800/80 transition-colors cursor-pointer`}
      >
        <h3 className="text-white font-semibold text-sm mb-3">{stats.name}</h3>
        <div className="grid grid-cols-2 gap-y-2 text-xs mb-4">
          <span className="text-slate-400">Áreas</span>
          <span className="text-white text-right">{stats.units.length}</span>
          <span className="text-slate-400">Materiales</span>
          <span className="text-white text-right">
            ${stats.materialsThisCycle.toLocaleString('en-CA', { minimumFractionDigits: 0 })}
          </span>
          <span className="text-slate-400">Pendientes</span>
          <span className={`text-right font-semibold ${stats.pendingApprovals > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {stats.pendingApprovals > 0 ? `${stats.pendingApprovals} ⚠` : '0 ✓'}
          </span>
        </div>
        <HoursBar
          used={hoursBalance.usedHours}
          plan={hoursBalance.planHours}
          available={hoursBalance.availableHours}
          showWarning
        />
      </div>
    </Link>
  )
}
