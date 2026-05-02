'use server'

import { auth } from '@/lib/auth/config'
import { createInspection } from '@/lib/sheets/inspections'
import { createWorkOrder } from '@/lib/sheets/work-orders'
import { completeInspectionRequest } from '@/lib/sheets/inspection-requests'
import { getSheetsClient, getSpreadsheetId } from '@/lib/sheets/client'
import { getCurrentCycleLabel } from '@/lib/hours'
import { revalidatePath } from 'next/cache'

const CYCLE_DAY_START = 25
const ALL_VISITS = 'All_Visits'

const CATEGORY_LABELS: Record<string, string> = {
  commonAreas: 'Common Areas',
  exterior: 'Exterior',
  windows: 'Windows',
  walls: 'Walls',
  bathroom: 'Bathroom',
  kitchen: 'Kitchen',
  floor: 'Floor',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  hvac: 'HVAC',
  safety: 'Safety',
}

export interface InspectionPayload {
  requestId: string
  building: string
  unitId: string
  areaName: string
  areaType: string
  visitType: string
  tenantPresent: boolean
  tenantName: string
  startedAt: string
  categories: Record<string, { status: string; notes: string }>
}

function formatTime(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toTimeString().slice(0, 5)
  } catch {
    return ''
  }
}

function calcDurationHours(startIso: string): number {
  try {
    const diff = Date.now() - new Date(startIso).getTime()
    return Math.max(0.1, Math.round((diff / 3600000) * 10) / 10)
  } catch {
    return 0
  }
}

export async function actionSubmitInspection(
  payload: InspectionPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return { ok: false, error: 'Unauthorized' }

    const cycleLabel = getCurrentCycleLabel(CYCLE_DAY_START)
    const technician = session.user.name ?? session.user.email ?? 'unknown'

    const endedAt = new Date()
    const durationHours = calcDurationHours(payload.startedAt)
    const timeIn = formatTime(payload.startedAt)
    const timeOut = endedAt.toTimeString().slice(0, 5)
    const today = endedAt.toISOString().split('T')[0]

    const issueCategories = Object.entries(payload.categories).filter(([, v]) => v.status !== 'OK')
    const urgentCategories = issueCategories.filter(([, v]) => v.status === 'Urgent')

    // Create one work order per non-OK category
    for (const [key, cat] of issueCategories) {
      const label = CATEGORY_LABELS[key] ?? key
      const description = cat.notes.trim() ? `${label}: ${cat.notes}` : label
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

    // Write inspection record
    const inspId = `INS-${Date.now()}`
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

    // Write to All_Visits — deducts hours from the 40h plan automatically
    const issueSummary = issueCategories.length > 0
      ? issueCategories.map(([k]) => CATEGORY_LABELS[k] ?? k).join(', ')
      : 'No issues found'

    const highestPriority = urgentCategories.length > 0 ? 'High'
      : issueCategories.length > 0 ? 'Medium' : 'Low'

    const sheets = await getSheetsClient()
    await sheets.spreadsheets.values.append({
      spreadsheetId: getSpreadsheetId(),
      range: `${ALL_VISITS}!A:AC`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          today,
          'Inspection',
          technician,
          payload.building,
          payload.unitId,
          payload.areaType,
          payload.areaName,
          payload.visitType,
          timeIn,
          timeOut,
          durationHours,
          issueSummary,
          `Inspection completed — ${issueCategories.length} issue${issueCategories.length !== 1 ? 's' : ''} found`,
          highestPriority,
          'Approved',
          0,
          ...Array(13).fill(''),
        ]],
      },
    })

    // Complete the inspection request
    await completeInspectionRequest(
      payload.requestId,
      technician,
      durationHours,
      inspId,
    )

    revalidatePath('/work-orders')
    revalidatePath('/inspections')
    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
