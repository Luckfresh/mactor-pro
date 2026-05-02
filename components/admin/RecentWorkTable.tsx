import Link from 'next/link'
import { formatDate } from '@/lib/hours'
import type { Visit } from '@/types'

interface RecentWorkTableProps {
  visits: Visit[]
}

const BUILDING_SHORT: Record<string, string> = {
  'PHASE I 72 Isabella': 'Ph I',
  'PHASE II Church': 'Ph II',
  'PHASE III Wellesley': 'Ph III',
}

const BUILDING_CHIP: Record<string, string> = {
  'PHASE I 72 Isabella': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'PHASE II Church': 'bg-sky-50 text-sky-700 border-sky-200',
  'PHASE III Wellesley': 'bg-violet-50 text-violet-700 border-violet-200',
}

export function RecentWorkTable({ visits }: RecentWorkTableProps) {
  if (visits.length === 0) {
    return <p className="text-slate-500 text-sm">No recent work.</p>
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-[90px_76px_1fr_130px_64px_88px_88px] gap-2 px-5 py-2.5 bg-gray-50 border-b border-gray-200">
        {['Date','Building','Unit / Area','Work Type','Hours','Cost','Status'].map(h => (
          <span key={h} className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{h}</span>
        ))}
      </div>
      {visits.map((v, i) => {
        const buildingSlug = encodeURIComponent(v.building)
        const unitSlug = encodeURIComponent(v.unitId)
        const tag = BUILDING_SHORT[v.building] ?? v.building
        const chipColor = BUILDING_CHIP[v.building] ?? 'bg-slate-100 text-slate-600 border-slate-200'

        return (
          <Link
            key={i}
            href={`/buildings/${buildingSlug}/units/${unitSlug}`}
            className="grid grid-cols-[90px_76px_1fr_130px_64px_88px_88px] gap-2 px-5 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
          >
            <span className="text-slate-500 text-xs self-center">{formatDate(v.date)}</span>
            <span className="self-center">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${chipColor}`}>{tag}</span>
            </span>
            <span className="text-slate-900 text-sm font-medium truncate self-center">{v.areaName || v.unitId}</span>
            <span className="text-slate-600 text-sm truncate self-center">{v.visitType}</span>
            <span className="text-slate-900 text-sm font-medium self-center">{v.duration.toFixed(1)}h</span>
            <span className="text-slate-600 text-sm self-center">
              {v.materialCost > 0
                ? `$${v.materialCost.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'}
            </span>
            <span className="self-center">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                v.status === 'Completed'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : v.status === 'Pending'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                {v.status}
              </span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
