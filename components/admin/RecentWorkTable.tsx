import type { Visit } from '@/types'

interface RecentWorkTableProps {
  visits: Visit[]
}

export function RecentWorkTable({ visits }: RecentWorkTableProps) {
  if (visits.length === 0) {
    return <p className="text-slate-400 text-sm">Sin trabajos recientes.</p>
  }

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[100px_1fr_160px_70px_80px_90px] gap-2 px-4 py-2 text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
        <span>Fecha</span>
        <span>Unidad</span>
        <span>Tipo</span>
        <span>Horas</span>
        <span>Costo</span>
        <span>Estado</span>
      </div>
      {visits.map((v, i) => (
        <div
          key={i}
          className="grid grid-cols-[100px_1fr_160px_70px_80px_90px] gap-2 px-4 py-3 text-sm border-b border-slate-700/50 last:border-0"
        >
          <span className="text-slate-400">{v.date}</span>
          <span className="text-white truncate">{v.unitId}</span>
          <span className="text-slate-300 truncate">{v.visitType}</span>
          <span className="text-white">{v.duration}h</span>
          <span className="text-white">
            {v.materialCost > 0 ? `$${v.materialCost.toLocaleString('en-CA')}` : '—'}
          </span>
          <span>
            <span className={`text-xs px-2 py-1 rounded-md font-medium ${
              v.status === 'Completed'
                ? 'bg-green-900/40 text-green-400'
                : 'bg-slate-700 text-slate-400'
            }`}>
              {v.status}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}
