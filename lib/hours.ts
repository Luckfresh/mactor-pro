import type { Visit, ClientPlan, CycleBalance, ClientHoursBalance } from '@/types'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function getCurrentCycleLabel(cycleDayStart: number): string {
  const now = new Date()
  const day = now.getDate()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  if (day < cycleDayStart) {
    return `${year}-${String(month).padStart(2, '0')}`
  } else {
    const endMonth = month === 12 ? 1 : month + 1
    const endYear = month === 12 ? year + 1 : year
    return `${endYear}-${String(endMonth).padStart(2, '0')}`
  }
}

export function getCycleDates(
  cycleDayStart: number,
  cycleLabel: string,
): { start: string; end: string } {
  const [year, month] = cycleLabel.split('-').map(Number)

  const endDate = new Date(year, month - 1, cycleDayStart - 1)
  const end = endDate.toISOString().split('T')[0]

  const startMonth = month === 1 ? 12 : month - 1
  const startYear = month === 1 ? year - 1 : year
  const startDate = new Date(startYear, startMonth - 1, cycleDayStart)
  const start = startDate.toISOString().split('T')[0]

  return { start, end }
}

function getRolloverForCycle(
  closedCycles: CycleBalance[],
  currentLabel: string,
  hoursPerCycle: number,
): number {
  const previous = closedCycles
    .filter(c => c.cycleLabel < currentLabel)
    .sort((a, b) => b.cycleLabel.localeCompare(a.cycleLabel))[0]

  if (!previous) return 0
  return Math.min(previous.rolledOverOut, hoursPerCycle * 3)
}

export function calculateClientHoursBalance(
  visits: Visit[],
  clientPlan: ClientPlan,
  closedCycles: CycleBalance[],
  cycleLabel: string,
): ClientHoursBalance {
  const cycleDayStart = 25
  const { start, end } = getCycleDates(cycleDayStart, cycleLabel)

  const rolledOverHours = getRolloverForCycle(closedCycles, cycleLabel, clientPlan.hoursPerCycle)
  const availableHours = clientPlan.hoursPerCycle + rolledOverHours

  const cycleVisits = visits.filter(
    v => clientPlan.buildings.includes(v.building) && v.date >= start && v.date <= end,
  )

  const usedHours = Math.round(cycleVisits.reduce((sum, v) => sum + v.duration, 0) * 100) / 100
  const extraHours = Math.max(0, Math.round((usedHours - availableHours) * 100) / 100)

  const byBuilding: Record<string, number> = {}
  for (const building of clientPlan.buildings) {
    const h = cycleVisits
      .filter(v => v.building === building)
      .reduce((sum, v) => sum + v.duration, 0)
    byBuilding[building] = Math.round(h * 100) / 100
  }

  return {
    clientId: clientPlan.clientId,
    planHours: clientPlan.hoursPerCycle,
    rolledOverHours,
    availableHours,
    usedHours,
    extraHours,
    cycleLabel,
    cycleStart: start,
    cycleEnd: end,
    byBuilding,
  }
}

export function getHoursUsedInBuilding(
  visits: Visit[],
  buildingName: string,
  cycleStart: string,
  cycleEnd: string,
): number {
  const used = visits
    .filter(v => v.building === buildingName && v.date >= cycleStart && v.date <= cycleEnd)
    .reduce((sum, v) => sum + v.duration, 0)
  return Math.round(used * 100) / 100
}

export function formatCycleRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    if (!iso) return ''
    const [, m, d] = iso.split('-')
    return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

export function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]} ${y}`
}
