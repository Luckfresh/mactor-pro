import { getSheetsClient, getSpreadsheetId } from './client'

const SHEET = 'Inspection_Requests'

export type InspectionRequestStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled'

export interface InspectionRequest {
  requestId: string
  date: string
  building: string
  unitId: string
  areaName: string
  requestedBy: string
  notes: string
  status: InspectionRequestStatus
  startedAt: string
  completedAt: string
  durationHours: number
  completedBy: string
  inspectionId: string
}

function rowToRequest(row: unknown[]): InspectionRequest {
  return {
    requestId: String(row[0] ?? '').trim(),
    date: String(row[1] ?? '').trim(),
    building: String(row[2] ?? '').trim(),
    unitId: String(row[3] ?? '').trim(),
    areaName: String(row[4] ?? '').trim(),
    requestedBy: String(row[5] ?? '').trim(),
    notes: String(row[6] ?? '').trim(),
    status: String(row[7] ?? 'Pending').trim() as InspectionRequestStatus,
    startedAt: String(row[8] ?? '').trim(),
    completedAt: String(row[9] ?? '').trim(),
    durationHours: parseFloat(String(row[10] ?? '0')) || 0,
    completedBy: String(row[11] ?? '').trim(),
    inspectionId: String(row[12] ?? '').trim(),
  }
}

export async function getInspectionRequests(filters?: {
  status?: InspectionRequestStatus | InspectionRequestStatus[]
  building?: string
}): Promise<InspectionRequest[]> {
  try {
    const sheets = await getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${SHEET}!A2:M`,
    })
    const rows = res.data.values ?? []
    return rows
      .filter(row => row.length >= 1 && row[0])
      .map(rowToRequest)
      .filter(r => {
        if (filters?.building && r.building !== filters.building) return false
        if (filters?.status) {
          const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
          if (!statuses.includes(r.status)) return false
        }
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  } catch {
    return []
  }
}

export async function getPendingInspectionCount(building?: string): Promise<number> {
  const requests = await getInspectionRequests({
    status: 'Pending',
    ...(building ? { building } : {}),
  })
  return requests.length
}

export async function createInspectionRequest(data: {
  building: string
  unitId: string
  areaName: string
  requestedBy: string
  notes: string
}): Promise<string> {
  const sheets = await getSheetsClient()
  const id = `IR-${Date.now()}`
  const today = new Date().toISOString().split('T')[0]

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A:M`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        id, today, data.building, data.unitId, data.areaName,
        data.requestedBy, data.notes, 'Pending',
        '', '', '', '', '',
      ]],
    },
  })
  return id
}

async function findRequestRow(requestId: string): Promise<number> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A2:A`,
  })
  const rows = res.data.values ?? []
  const idx = rows.findIndex(r => String(r[0] ?? '').trim() === requestId)
  if (idx === -1) throw new Error(`Inspection request not found: ${requestId}`)
  return idx + 2
}

export async function startInspectionRequest(requestId: string): Promise<void> {
  const sheets = await getSheetsClient()
  const sheetRow = await findRequestRow(requestId)

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!H${sheetRow}:I${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['In Progress', new Date().toISOString()]] },
  })
}

export async function completeInspectionRequest(
  requestId: string,
  completedBy: string,
  durationHours: number,
  inspectionId: string,
): Promise<void> {
  const sheets = await getSheetsClient()
  const sheetRow = await findRequestRow(requestId)

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!H${sheetRow}:M${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['Completed', '', new Date().toISOString(), durationHours.toFixed(2), completedBy, inspectionId]],
    },
  })
}

export async function cancelInspectionRequest(requestId: string): Promise<void> {
  const sheets = await getSheetsClient()
  const sheetRow = await findRequestRow(requestId)

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!H${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['Cancelled']] },
  })
}
