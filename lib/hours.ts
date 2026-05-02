import type { Visit, BuildingConfig, HoursBalance } from '@/types'

// Cycle convention: runs from cycleDayStart of month M to (cycleDayStart-1) of month M+1
// Cycle label = the month M+1 (end month), e.g. "2026-05" = Apr 25 – May 24
export function getCurrentCycleLabel(config: BuildingConfig): string {
  const now = new Date()
  const day = now.getDate()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-indexed

  if (day < config.cycleDayStart) {
    // Before reset day: still in cycle that ends this month
    return `${year}-${String(month).padStart(2, '0')}`
  } else {
    // On or after reset day: in new cycle that ends next month
    const endMonth = month === 12 ? 1 : month + 1
    const endYear = month === 12 ? year + 1 : year
    return `${endYear}-${String(endMonth).padStart(2, '0')}`
  }
}

export function getCycleDates(
  config: BuildingConfig,
  cycleLabel: string
): { start: string; end: string } {
  const [year, month] = cycleLabel.split('-').map(Number) // month = end month (1-indexed)

  // Cycle ends on (cycleDayStart - 1) of end month
  const endDate = new Date(year, month - 1, config.cycleDayStart - 1)
  const end = endDate.toISOString().split('T')[0]

  // Cycle starts on cycleDayStart of previous month
  const startMonth = month === 1 ? 12 : month - 1
  const startYear = month === 1 ? year - 1 : year
  const startDate = new Date(startYear, startMonth - 1, config.cycleDayStart)
  const start = startDate.toISOString().split('T')[0]

  return { start, end }
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

export function formatCycleRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${parseInt(d)} ${months[parseInt(m) - 1]}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

export function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}
