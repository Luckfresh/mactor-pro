'use server'

import { auth } from '@/lib/auth/config'
import { approveReviewEntry } from '@/lib/sheets/review-log'
import { revalidatePath } from 'next/cache'

export async function approveEntry(visitKey: string, comments: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await approveReviewEntry(visitKey, session.user.name ?? session.user.email ?? 'unknown', comments, true)
  revalidatePath('/approvals')
  revalidatePath('/')
}

export async function rejectEntry(visitKey: string, comments: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await approveReviewEntry(visitKey, session.user.name ?? session.user.email ?? 'unknown', comments, false)
  revalidatePath('/approvals')
  revalidatePath('/')
}
