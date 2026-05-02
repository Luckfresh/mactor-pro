interface HoursBarProps {
  used: number
  plan: number
  rollover?: number
  cycleRange?: string
  showWarning?: boolean
}

export function HoursBar({ used, plan, rollover = 0, cycleRange, showWarning }: HoursBarProps) {
  const available = plan + rollover
  const remaining = Math.max(0, available - used)
  const pct = available > 0 ? Math.min(100, Math.round((used / available) * 100)) : 0
  const isHigh = pct >= 80
  const hasExtra = used > available

  return (
    <div>
      {cycleRange && (
        <p className="text-slate-500 text-xs mb-1">Cycle: {cycleRange}</p>
      )}
      <div className="flex justify-between text-xs mb-1">
        <span className={isHigh ? 'text-amber-400' : 'text-slate-400'}>
          {used.toFixed(1)}h used of {available.toFixed(1)}h
          {rollover > 0 && <span className="text-sky-400 ml-1">(+{rollover.toFixed(1)}h rollover)</span>}
        </span>
        <span className={hasExtra ? 'text-red-400 font-semibold' : isHigh ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
          {hasExtra ? `${(used - available).toFixed(1)}h over` : `${remaining.toFixed(1)}h left`}
        </span>
      </div>
      <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            hasExtra ? 'bg-red-500' : isHigh ? 'bg-amber-400' : 'bg-blue-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showWarning && isHigh && !hasExtra && (
        <p className="text-amber-400 text-xs mt-1">⚠ Hours running low this cycle</p>
      )}
      {showWarning && hasExtra && (
        <p className="text-red-400 text-xs mt-1">Over plan — extra hours at $75/h</p>
      )}
    </div>
  )
}
