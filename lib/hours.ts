import type { Visit, BuildingConfig, HoursBalance } from '@/types'

export function getCurrentCycleLabel(config: BuildingConfig): string {
  const now = new Date()
  const day = now.getDate()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed

  // If today is before the cycle start day, we're still in last month's cycle
  const cycleMonth = day >= config.cycleDayStart ? month : month - 1
  const cycleYear = cycleMonth < 0 ? year - 1 : year
  const normalizedMonth = ((cycleMonth % 12) + 12) % 12

  return `${cycleYear}-${String(normalizedMonth + 1).padStart(2, '0')}`
}

export function getCycleDates(
  config: BuildingConfig,
  cycleLabel: string
): { start: string; end: string } {
  const [year, month] = cycleLabel.split('-').map(Number)
  const start = new Date(year, month - 1, config.cycleDayStart)

  // End is the day before the same day next month
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const end = new Date(endYear, endMonth - 1, config.cycleDayStart - 1)

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export function calculateHoursBalance(
  visits: Visit[],
  config: BuildingConfig,
  cycleLabel: string
): HoursBalance {
  const { start, end } = getCycleDates(config, cycleLabel)

  const cycleVisits = visits.filter(
    v => v.building === config.buildingName && v.date >= start && v.date <= end
  )

  const usedHours = cycleVisits.reduce((sum, v) => sum + v.duration, 0)

  // Rollover tracking is deferred — starts at 0 until historical cycle data is captured
  const rolledOverHours = 0

  return {
    planHours: config.hoursPerCycle,
    usedHours: Math.round(usedHours * 100) / 100,
    rolledOverHours,
    availableHours: Math.max(0, config.hoursPerCycle + rolledOverHours - usedHours),
    cycleLabel,
    cycleStart: start,
    cycleEnd: end,
  }
}
