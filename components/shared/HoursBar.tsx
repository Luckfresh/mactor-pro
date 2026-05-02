interface HoursBarProps {
  used: number
  plan: number
  available: number
  cycleRange?: string
  showWarning?: boolean
}

export function HoursBar({ used, plan, available, cycleRange, showWarning }: HoursBarProps) {
  const pct = plan > 0 ? Math.min(100, Math.round((used / plan) * 100)) : 0
  const isHigh = pct >= 80

  return (
    <div>
      {cycleRange && (
        <p className="text-slate-500 text-xs mb-1">Ciclo: {cycleRange}</p>
      )}
      <div className="flex justify-between text-xs mb-1">
        <span className={isHigh ? 'text-amber-400' : 'text-slate-400'}>
          {used.toFixed(1)}h usadas de {plan}h
        </span>
        <span className={isHigh ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
          {available.toFixed(1)}h disponibles
        </span>
      </div>
      <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? 'bg-amber-400' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showWarning && isHigh && (
        <p className="text-amber-400 text-xs mt-1">⚠ Quedan pocas horas este ciclo</p>
      )}
    </div>
  )
}
