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
        <p className="text-slate-500 text-xs mb-2">Cycle: {cycleRange}</p>
      )}
      <div className="flex justify-between text-xs mb-2">
        <span className={`font-medium ${isHigh ? 'text-amber-600' : 'text-slate-600'}`}>
          {used.toFixed(1)}h used of {available.toFixed(1)}h
          {rollover > 0 && <span className="text-indigo-500 ml-1">(+{rollover.toFixed(1)}h rollover)</span>}
        </span>
        <span className={`font-semibold ${hasExtra ? 'text-red-600' : isHigh ? 'text-amber-600' : 'text-slate-500'}`}>
          {hasExtra ? `${(used - available).toFixed(1)}h over` : `${remaining.toFixed(1)}h left`}
        </span>
      </div>
      <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            hasExtra ? 'bg-red-500' : isHigh ? 'bg-amber-400' : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showWarning && isHigh && !hasExtra && (
        <p className="text-amber-600 text-xs mt-1.5 font-medium">⚠ Hours running low this cycle</p>
      )}
      {showWarning && hasExtra && (
        <p className="text-red-600 text-xs mt-1.5 font-medium">Over plan — extra hours at $75/h</p>
      )}
    </div>
  )
}
