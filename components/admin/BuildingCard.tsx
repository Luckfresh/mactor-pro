import Link from 'next/link'
import { HoursBar } from '@/components/shared/HoursBar'
import { formatCycleRange } from '@/lib/hours'
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
  const cycleRange = formatCycleRange(hoursBalance.cycleStart, hoursBalance.cycleEnd)

  return (
    <Link href={`/buildings/${slug}`} className="block">
      <div
        className={`bg-slate-800 rounded-xl p-5 border-l-4 ${BUILDING_COLORS[index % 3]} hover:bg-slate-700/80 transition-colors cursor-pointer`}
      >
        <h3 className="text-white font-semibold text-sm mb-3">{stats.name}</h3>
        <div className="grid grid-cols-2 gap-y-2 text-xs mb-4">
          <span className="text-slate-400">Áreas / Unidades</span>
          <span className="text-white text-right">{stats.units.length}</span>
          <span className="text-slate-400">Materiales ciclo</span>
          <span className="text-white text-right">
            ${stats.materialsThisCycle.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-slate-400">Aprobaciones</span>
          <span className={`text-right font-semibold ${stats.pendingApprovals > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {stats.pendingApprovals > 0 ? `${stats.pendingApprovals} pendientes ⚠` : 'Al día ✓'}
          </span>
        </div>
        <HoursBar
          used={hoursBalance.usedHours}
          plan={hoursBalance.planHours}
          available={hoursBalance.availableHours}
          cycleRange={cycleRange}
          showWarning
        />
      </div>
    </Link>
  )
}
