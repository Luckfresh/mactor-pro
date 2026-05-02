import { getSheetsClient, getSpreadsheetId, toNumber, toBoolean } from './client'
import type { TenantReport, TenantReportStatus } from '@/types'

const SHEET = 'Tenant_Reports'

// Columns: reportId(A) date(B) building(C) unitId(D) tenantName(E)
//          phone(F) email(G) description(H) urgency(I) status(J)
//          wantsQuote(K) serviceType(L) quotedAmount(M) adminNotes(N) resolvedDate(O)

function rowToReport(row: unknown[]): TenantReport {
  return {
    reportId: String(row[0] ?? '').trim(),
    date: String(row[1] ?? '').trim(),
    building: String(row[2] ?? '').trim(),
    unitId: String(row[3] ?? '').trim(),
    tenantName: String(row[4] ?? '').trim(),
    phone: String(row[5] ?? '').trim(),
    email: String(row[6] ?? '').trim(),
    description: String(row[7] ?? '').trim(),
    urgency: String(row[8] ?? '').trim(),
    status: (String(row[9] ?? '').trim() || 'Pending') as TenantReportStatus,
    wantsQuote: toBoolean(row[10]),
    serviceType: String(row[11] ?? '').trim(),
    quotedAmount: toNumber(row[12]),
    adminNotes: String(row[13] ?? '').trim(),
    resolvedDate: String(row[14] ?? '').trim(),
  }
}

export async function getTenantReports(filters?: {
  building?: string
  unitId?: string
  phone?: string
  email?: string
}): Promise<TenantReport[]> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A2:O`,
  })
  const rows = res.data.values ?? []
  return rows
    .filter(row => row.length >= 3 && row[0])
    .map(rowToReport)
    .filter(r => {
      if (filters?.building && r.building !== filters.building) return false
      if (filters?.unitId && r.unitId !== filters.unitId) return false
      if (filters?.phone && r.phone !== filters.phone) return false
      if (filters?.email && r.email.toLowerCase() !== filters.email.toLowerCase()) return false
      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function createTenantReport(data: {
  building: string
  unitId: string
  tenantName: string
  phone: string
  email: string
  description: string
  urgency: string
  wantsQuote: boolean
}): Promise<string> {
  const sheets = await getSheetsClient()
  const id = `TR-${Date.now()}`
  const today = new Date().toISOString().split('T')[0]

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A:O`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        id, today, data.building, data.unitId, data.tenantName,
        data.phone, data.email, data.description, data.urgency,
        'Pending', data.wantsQuote ? 'TRUE' : 'FALSE', '', '', '', '',
      ]],
    },
  })
  return id
}

export async function updateTenantReportStatus(
  reportId: string,
  status: TenantReportStatus,
  adminNotes?: string,
  quotedAmount?: number
): Promise<void> {
  const sheets = await getSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${SHEET}!A2:A` })
  const keys = res.data.values ?? []
  const rowIdx = keys.findIndex(r => String(r[0] ?? '').trim() === reportId)
  if (rowIdx === -1) throw new Error(`Report not found: ${reportId}`)
  const sheetRow = rowIdx + 2
  const today = new Date().toISOString().split('T')[0]

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET}!J${sheetRow}:O${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        status,
        '',
        quotedAmount ?? '',
        adminNotes ?? '',
        status === 'Resolved' ? today : '',
      ]],
    },
  })
}
