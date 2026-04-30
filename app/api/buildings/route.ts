import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getBuildingConfigs } from '@/lib/sheets/building-config'
import { getUnitsSummary } from '@/lib/sheets/units-summary'
import { getPendingApprovalCount } from '@/lib/sheets/review-log'
import { getAllVisits } from '@/lib/sheets/all-visits'
import { getCurrentCycleLabel, calculateHoursBalance } from '@/lib/hours'
import type { BuildingStats } from '@/types'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const configs = await getBuildingConfigs()

  // Filter by assigned buildings for managers
  const allowedConfigs = session.user.role === 'admin'
    ? configs
    : configs.filter(c => session.user.buildings.includes(c.buildingName))

  const allVisits = await getAllVisits()

  const stats: BuildingStats[] = await Promise.all(
    allowedConfigs.map(async config => {
      const units = await getUnitsSummary(config.buildingName)
      const pending = await getPendingApprovalCount(config.buildingName)
      const cycleLabel = getCurrentCycleLabel(config)
      const hoursBalance = calculateHoursBalance(allVisits, config, cycleLabel)

      return {
        name: config.buildingName,
        config,
        units,
        pendingApprovals: pending,
        hoursBalance,
        materialsThisCycle: allVisits
          .filter(v => v.building === config.buildingName && v.date >= hoursBalance.cycleStart)
          .reduce((sum, v) => sum + v.materialCost, 0),
      }
    })
  )

  return NextResponse.json(stats)
}
