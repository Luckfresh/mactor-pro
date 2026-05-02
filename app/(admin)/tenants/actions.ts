'use server'

import { auth } from '@/lib/auth/config'
import { updateTenantReportStatus } from '@/lib/sheets/tenant-reports'
import { createWorkOrder } from '@/lib/sheets/work-orders'
import { getCurrentCycleLabel } from '@/lib/hours'
import { revalidatePath } from 'next/cache'
import type { TenantReportStatus } from '@/types'

const CYCLE_DAY_START = 25

export async function actionUpdateReportStatus(
  reportId: string,
  status: TenantReportStatus,
  adminNotes?: string,
  quotedAmount?: number
) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  await updateTenantReportStatus(reportId, status, adminNotes, quotedAmount)
  revalidatePath('/tenants')
}

export async function actionApproveAndCreateWorkOrder(data: {
  reportId: string
  building: string
  unitId: string
  areaName: string
  description: string
  urgency: string
  adminNotes?: string
}) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const cycleLabel = getCurrentCycleLabel(CYCLE_DAY_START)
  await createWorkOrder({
    building: data.building,
    unitId: data.unitId,
    areaName: data.areaName,
    description: data.description,
    priority: data.urgency,
    createdBy: session.user.name ?? session.user.email ?? 'unknown',
    cycleLabel,
    status: 'Pending',
  })

  await updateTenantReportStatus(data.reportId, 'Approved', data.adminNotes)
  revalidatePath('/tenants')
  revalidatePath('/work-orders')
}
