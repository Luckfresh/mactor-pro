'use server'

import { auth } from '@/lib/auth/config'
import {
  createWorkOrder,
  claimWorkOrder,
  startWorkOrder,
  completeWorkOrder,
  approveReportedWorkOrder,
  rejectWorkOrder,
} from '@/lib/sheets/work-orders'
import { getCurrentCycleLabel } from '@/lib/hours'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const CYCLE_DAY_START = 25

export async function actionCreateWorkOrder(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const building = String(formData.get('building') ?? '').trim()
  const unitId = String(formData.get('unitId') ?? '').trim()
  const areaName = String(formData.get('areaName') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const priority = String(formData.get('priority') ?? 'Medium').trim()

  if (!building || !description) throw new Error('Building and description are required')

  await createWorkOrder({
    building,
    unitId,
    areaName,
    description,
    priority,
    createdBy: session.user.name ?? session.user.email ?? 'unknown',
    cycleLabel: getCurrentCycleLabel(CYCLE_DAY_START),
  })

  redirect('/work-orders')
}

export async function actionClaimWorkOrder(id: string, photoBeforeUrl?: string) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') throw new Error('Unauthorized')
  await claimWorkOrder(id, session.user.name ?? session.user.email ?? 'unknown', photoBeforeUrl)
  revalidatePath('/work-orders')
}

export async function actionStartWorkOrder(id: string) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') throw new Error('Unauthorized')
  await startWorkOrder(id)
  revalidatePath('/work-orders')
}

export async function actionCompleteWorkOrder(
  id: string,
  duration: number,
  materialCost: number,
  notes: string,
  photoAfterUrl?: string,
) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') throw new Error('Unauthorized')
  await completeWorkOrder(
    id,
    session.user.name ?? session.user.email ?? 'unknown',
    duration,
    materialCost,
    notes,
    photoAfterUrl,
  )
  revalidatePath('/work-orders')
  revalidatePath('/')
}

export async function actionApproveWorkOrder(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  await approveReportedWorkOrder(id)
  revalidatePath('/work-orders')
}

export async function actionRejectWorkOrder(id: string, reason: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  await rejectWorkOrder(id, reason)
  revalidatePath('/work-orders')
}
