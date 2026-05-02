import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getBuildingConfigs } from '@/lib/sheets/building-config'
import { getUnitsSummary } from '@/lib/sheets/units-summary'
import { getPendingApprovalCount } from '@/lib/sheets/review-log'
import { getAllVisits } from '@/lib/sheets/all-visits'
import { getCurrentCycleLabel, getCycleDates, getHoursUsedInBuilding } from '@/lib/hours'
import type { BuildingStats } from '@/types'

const CYCLE_DAY_START = 25

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const configs = await getBuildingConfigs()

  const allowedConfigs = session.user.role === 'admin'
    ? configs
    : configs.filter(c => session.user.buildings.includes(c.buildingName))

  const allVisits = await getAllVisits()
  const cycleLabel = getCurrentCycleLabel(CYCLE_DAY_START)
  const { start: cycleStart, end: cycleEnd } = getCycleDates(CYCLE_DAY_START, cycleLabel)

  const stats: BuildingStats[] = await Promise.all(
    allowedConfigs.map(async config => {
      const [units, pending] = await Promise.all([
        getUnitsSummary(config.buildingName),
        getPendingApprovalCount(config.buildingName),
      ])
      const hoursUsedThisCycle = getHoursUsedInBuilding(allVisits, config.buildingName, cycleStart, cycleEnd)

      return {
        name: config.buildingName,
        config,
        units,
        pendingApprovals: pending,
        hoursUsedThisCycle,
        materialsThisCycle: allVisits
          .filter(v => v.building === config.buildingName && v.date >= cycleStart && v.date <= cycleEnd)
          .reduce((sum, v) => sum + v.materialCost, 0),
      }
    })
  )

  return NextResponse.json(stats)
}
