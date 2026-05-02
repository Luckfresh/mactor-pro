'use server'

import { auth } from '@/lib/auth/config'
import { createInspection } from '@/lib/sheets/inspections'
import { createWorkOrder } from '@/lib/sheets/work-orders'
import { getCurrentCycleLabel } from '@/lib/hours'
import { revalidatePath } from 'next/cache'

const CYCLE_DAY_START = 25

export interface InspectionPayload {
  building: string
  unitId: string
  areaType: string
  areaName: string
  defectType: string
  urgency: string
  description: string
  estimatedHours: number
  notes: string
}

export async function actionSubmitInspection(
  payload: InspectionPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return { ok: false, error: 'Unauthorized' }

    const cycleLabel = getCurrentCycleLabel(CYCLE_DAY_START)
    const technician = session.user.name ?? session.user.email ?? 'unknown'

    // Create work order in 'Reported' status — requires manager approval before Julio can claim it
    const workOrderId = await createWorkOrder({
      building: payload.building,
      unitId: payload.unitId,
      areaName: payload.areaName,
      description: payload.description,
      priority: payload.urgency,
      createdBy: technician,
      cycleLabel,
      status: 'Reported',
    })

    await createInspection({
      building: payload.building,
      unitId: payload.unitId,
      areaType: payload.areaType,
      areaName: payload.areaName,
      defectType: payload.defectType,
      urgency: payload.urgency,
      description: payload.description,
      estimatedHours: payload.estimatedHours,
      notes: payload.notes,
      technician,
      cycleLabel,
      workOrderId,
    })

    revalidatePath('/work-orders')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
