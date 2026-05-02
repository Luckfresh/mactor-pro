'use server'

import { auth } from '@/lib/auth/config'
import {
  createInspectionRequest,
  startInspectionRequest,
  cancelInspectionRequest,
} from '@/lib/sheets/inspection-requests'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function actionRequestInspection(data: {
  building: string
  unitId: string
  areaName: string
  notes: string
}) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const requestedBy = session.user.name ?? session.user.email ?? 'unknown'
  await createInspectionRequest({ ...data, requestedBy })
  revalidatePath('/inspections')
  redirect('/inspections')
}

export async function actionStartInspection(requestId: string) {
  const session = await auth()
  if (session?.user.role !== 'admin') throw new Error('Unauthorized')

  await startInspectionRequest(requestId)
  revalidatePath('/inspections')
  redirect(`/inspect?requestId=${requestId}`)
}

export async function actionCancelInspectionRequest(requestId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await cancelInspectionRequest(requestId)
  revalidatePath('/inspections')
}
