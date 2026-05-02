'use server'

import { createTenantReport } from '@/lib/sheets/tenant-reports'

export async function actionSubmitTenantReport(data: {
  building: string
  unitId: string
  tenantName: string
  phone: string
  email: string
  description: string
  urgency: string
  wantsQuote: boolean
}): Promise<{ ok: boolean; reportId?: string; error?: string }> {
  try {
    if (!data.tenantName.trim()) return { ok: false, error: 'Name is required.' }
    if (!data.phone.trim() && !data.email.trim()) return { ok: false, error: 'Phone or email is required.' }
    if (!data.description.trim()) return { ok: false, error: 'Description is required.' }

    const reportId = await createTenantReport(data)
    return { ok: true, reportId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to submit report.' }
  }
}

export async function actionLookupReports(
  building: string,
  unitId: string,
  contact: string
): Promise<{ ok: boolean; reports?: import('@/types').TenantReport[]; error?: string }> {
  try {
    const { getTenantReports } = await import('@/lib/sheets/tenant-reports')
    const isEmail = contact.includes('@')
    const reports = await getTenantReports({
      building,
      unitId,
      ...(isEmail ? { email: contact } : { phone: contact }),
    })
    return { ok: true, reports }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Lookup failed.' }
  }
}
