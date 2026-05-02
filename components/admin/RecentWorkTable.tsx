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

const BUILDING_COLOR: Record<string, string> = {
  'PHASE I 72 Isabella': 'bg-blue-900/50 text-blue-300',
  'PHASE II Church': 'bg-green-900/50 text-green-300',
  'PHASE III Wellesley': 'bg-amber-900/50 text-amber-300',
}

export function RecentWorkTable({ visits }: RecentWorkTableProps) {
  if (visits.length === 0) {
    return <p className="text-slate-400 text-sm">Sin trabajos recientes.</p>
  }

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[90px_80px_1fr_140px_70px_90px_90px] gap-2 px-4 py-2 text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
        <span>Fecha</span>
        <span>Edificio</span>
        <span>Unidad / Área</span>
        <span>Tipo de trabajo</span>
        <span>Horas</span>
        <span>Costo</span>
        <span>Estado</span>
      </div>
      {visits.map((v, i) => {
        const buildingSlug = encodeURIComponent(v.building)
        const unitSlug = encodeURIComponent(v.unitId)
        const shortTag = BUILDING_SHORT[v.building] ?? v.building
        const tagColor = BUILDING_COLOR[v.building] ?? 'bg-slate-700 text-slate-300'

        return (
          <Link
            key={i}
            href={`/buildings/${buildingSlug}/units/${unitSlug}`}
            className="grid grid-cols-[90px_80px_1fr_140px_70px_90px_90px] gap-2 px-4 py-3 text-sm border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50 transition-colors cursor-pointer"
          >
            <span className="text-slate-400 text-xs">{formatDate(v.date)}</span>
            <span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${tagColor}`}>{shortTag}</span>
            </span>
            <span className="text-white truncate">{v.areaName || v.unitId}</span>
            <span className="text-slate-300 truncate">{v.visitType}</span>
            <span className="text-white">{v.duration.toFixed(1)}h</span>
            <span className="text-white">
              {v.materialCost > 0
                ? `$${v.materialCost.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'}
            </span>
            <span>
              <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                v.status === 'Completed'
                  ? 'bg-green-900/40 text-green-400'
                  : v.status === 'Pending'
                  ? 'bg-amber-900/40 text-amber-400'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {v.status === 'Completed' ? 'Completado' : v.status === 'Pending' ? 'Pendiente' : v.status}
              </span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
