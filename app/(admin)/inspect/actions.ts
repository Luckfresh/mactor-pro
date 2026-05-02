'use server'

import { auth } from '@/lib/auth/config'
import { createInspection } from '@/lib/sheets/inspections'
import { createWorkOrder } from '@/lib/sheets/work-orders'
import { getCurrentCycleLabel } from '@/lib/hours'
import { revalidatePath } from 'next/cache'

const CYCLE_DAY_START = 25

const CATEGORY_LABELS: Record<string, string> = {
  commonAreas: 'Áreas Comunes',
  exterior: 'Exterior',
  windows: 'Ventanas',
  walls: 'Paredes',
  bathroom: 'Baño',
  kitchen: 'Cocina',
  floor: 'Piso',
  electrical: 'Eléctrico',
  plumbing: 'Plomería',
  hvac: 'HVAC',
  safety: 'Seguridad',
}

export interface InspectionPayload {
  building: string
  unitId: string
  areaName: string
  areaType: string
  visitType: string
  tenantPresent: boolean
  tenantName: string
  categories: Record<string, { status: string; notes: string }>
}

export async function actionSubmitInspection(
  payload: InspectionPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return { ok: false, error: 'Unauthorized' }

    const cycleLabel = getCurrentCycleLabel(CYCLE_DAY_START)
    const technician = session.user.name ?? session.user.email ?? 'unknown'

    const issueCategories = Object.entries(payload.categories).filter(([, v]) => v.status !== 'OK')
    const urgentCategories = issueCategories.filter(([, v]) => v.status === 'Urgent')

    for (const [key, cat] of issueCategories) {
      const label = CATEGORY_LABELS[key] ?? key
      const description = cat.notes.trim()
        ? `${label}: ${cat.notes}`
        : label
      await createWorkOrder({
        building: payload.building,
        unitId: payload.unitId,
        areaName: payload.areaName,
        description,
        priority: cat.status === 'Urgent' ? 'High' : 'Medium',
        createdBy: technician,
        cycleLabel,
        status: 'Reported',
      })
    }

    await createInspection({
      building: payload.building,
      unitId: payload.unitId,
      areaName: payload.areaName,
      areaType: payload.areaType,
      visitType: payload.visitType,
      tenantPresent: payload.tenantPresent,
      tenantName: payload.tenantName,
      technician,
      cycleLabel,
      commonAreas_status: payload.categories.commonAreas?.status ?? 'OK',
      commonAreas_notes: payload.categories.commonAreas?.notes ?? '',
      exterior_status: payload.categories.exterior?.status ?? 'OK',
      exterior_notes: payload.categories.exterior?.notes ?? '',
      windows_status: payload.categories.windows?.status ?? 'OK',
      windows_notes: payload.categories.windows?.notes ?? '',
      walls_status: payload.categories.walls?.status ?? 'OK',
      walls_notes: payload.categories.walls?.notes ?? '',
      bathroom_status: payload.categories.bathroom?.status ?? 'OK',
      bathroom_notes: payload.categories.bathroom?.notes ?? '',
      kitchen_status: payload.categories.kitchen?.status ?? 'OK',
      kitchen_notes: payload.categories.kitchen?.notes ?? '',
      floor_status: payload.categories.floor?.status ?? 'OK',
      floor_notes: payload.categories.floor?.notes ?? '',
      electrical_status: payload.categories.electrical?.status ?? 'OK',
      electrical_notes: payload.categories.electrical?.notes ?? '',
      plumbing_status: payload.categories.plumbing?.status ?? 'OK',
      plumbing_notes: payload.categories.plumbing?.notes ?? '',
      hvac_status: payload.categories.hvac?.status ?? 'OK',
      hvac_notes: payload.categories.hvac?.notes ?? '',
      safety_status: payload.categories.safety?.status ?? 'OK',
      safety_notes: payload.categories.safety?.notes ?? '',
      totalIssues: issueCategories.length,
      urgentIssues: urgentCategories.length,
    })

    revalidatePath('/work-orders')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
