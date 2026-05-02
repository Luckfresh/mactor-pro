import { getSheetsClient, getSpreadsheetId, toNumber } from './client'
import type { WorkOrder, WorkOrderStatus } from '@/types'

const SHEET = 'Work_Orders'
const ALL_VISITS = 'All_Visits'

// Columns: workOrderId(A) createdAt(B) building(C) unitId(D) areaName(E)
//          description(F) priority(G) createdBy(H) status(I) claimedBy(J)
//          claimedAt(K) startedAt(L) completedAt(M) duration(N) materialCost(O)
//          cycleLabel(P) notes(Q) photoBeforeUrl(R) photoAfterUrl(S) claimNotes(T)

function rowToWorkOrder(row: unknown[]): WorkOrder {
  return {
    id: String(row[0] ?? '').trim(),
    createdAt: String(row[1] ?? '').trim(),
    building: String(row[2] ?? '').trim(),
    unitId: String(row[3] ?? '').trim(),
    areaName: String(row[4] ?? '').trim(),
    description: String(row[5] ?? '').trim(),
    priority: String(row[6] ?? '').trim() as WorkOrder['priority'],
    createdBy: String(row[7] ?? '').trim(),
    status: String(row[8] ?? 'Pending').trim() as WorkOrderStatus,
    claimedBy: String(row[9] ?? '').trim(),
    claimedAt: String(row[10] ?? '').trim(),
    startedAt: String(row[11] ?? '').trim(),
    completedAt: String(row[12] ?? '').trim(),
    duration: toNumber(row[13]),
    materialCost: toNumber(row[14]),
    cycleLabel: String(row[15] ?? '').trim(),
    notes: String(row[16] ?? '').trim(),
    photoBeforeUrl: String(row[17] ?? '').trim(),
    photoAfterUrl: String(row[18] ?? '').trim(),
    claimNotes: String(row[19] ?? '').trim(),
  }
}

export async function getWorkOrders(filters?: {
  building?: string
  status?: WorkOrderStatus
}): Promise<WorkOrder[]> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A2:Q`,
  })
  const rows = res.data.values ?? []
  return rows
    .filter(row => row.length >= 3 && row[0])
    .map(rowToWorkOrder)
    .filter(wo => {
      if (filters?.building && wo.building !== filters.building) return false
      if (filters?.status && wo.status !== filters.status) return false
      return true
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createWorkOrder(data: {
  building: string
  unitId: string
  areaName: string
  description: string
  priority: string
  createdBy: string
  cycleLabel: string
  status?: WorkOrderStatus
}): Promise<string> {
  const sheets = await getSheetsClient()
  const id = `WO-${Date.now()}`
  const today = new Date().toISOString().split('T')[0]

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A:Q`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        id, today, data.building, data.unitId, data.areaName,
        data.description, data.priority, data.createdBy,
        data.status ?? 'Pending', '', '', '', '', '', '', data.cycleLabel, '',
      ]],
    },
  })

  return id
}

export async function getReportedWorkOrderCount(building?: string): Promise<number> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A2:I`,
  })
  const rows = res.data.values ?? []
  return rows.filter(row => {
    if (!row[0]) return false
    if (building && String(row[2] ?? '').trim() !== building) return false
    return String(row[8] ?? '').trim() === 'Reported'
  }).length
}

async function findWorkOrderRow(id: string): Promise<{ row: unknown[]; sheetRow: number }> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A2:Q`,
  })
  const rows = res.data.values ?? []
  const rowIdx = rows.findIndex(r => String(r[0] ?? '').trim() === id)
  if (rowIdx === -1) throw new Error(`Work order not found: ${id}`)
  return { row: rows[rowIdx], sheetRow: rowIdx + 2 }
}

export async function claimWorkOrder(id: string, by: string, photoBeforeUrl?: string, claimNotes?: string): Promise<void> {
  const sheets = await getSheetsClient()
  const { sheetRow } = await findWorkOrderRow(id)
  const today = new Date().toISOString().split('T')[0]
  const spreadsheetId = getSpreadsheetId()

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET}!I${sheetRow}:K${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['Claimed', by, today]] },
  })

  if (photoBeforeUrl || claimNotes) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET}!R${sheetRow}:T${sheetRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[photoBeforeUrl ?? '', '', claimNotes ?? '']] },
    })
  }
}

export async function startWorkOrder(id: string): Promise<void> {
  const sheets = await getSheetsClient()
  const { sheetRow } = await findWorkOrderRow(id)
  const today = new Date().toISOString().split('T')[0]
  const spreadsheetId = getSpreadsheetId()

  // Update status and startedAt separately to preserve claimedBy/claimedAt
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET}!I${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['In Progress']] },
  })
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET}!L${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[today]] },
  })
}

export async function completeWorkOrder(
  id: string,
  by: string,
  duration: number,
  materialCost: number,
  notes: string,
  photoAfterUrl?: string,
): Promise<void> {
  const sheets = await getSheetsClient()
  const spreadsheetId = getSpreadsheetId()
  const { row, sheetRow } = await findWorkOrderRow(id)
  const today = new Date().toISOString().split('T')[0]

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET}!I${sheetRow}:Q${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        'Completed',
        String(row[9] ?? ''),  // claimedBy
        String(row[10] ?? ''), // claimedAt
        String(row[11] ?? ''), // startedAt
        today,                  // completedAt
        duration,
        materialCost,
        String(row[15] ?? ''), // cycleLabel
        notes,
      ]],
    },
  })

  if (photoAfterUrl) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET}!S${sheetRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[photoAfterUrl]] },
    })
  }

  // Build photo columns for All_Visits (cols 16-28)
  const photoArr = Array(13).fill('')
  const photoBeforeStored = String(row[17] ?? '').trim()
  const photoAfterStored = photoAfterUrl ?? ''
  if (photoBeforeStored) photoArr[11] = photoBeforeStored // col 27 = Before
  if (photoAfterStored)  photoArr[12] = photoAfterStored  // col 28 = After

  // Compose problem: description + claim notes if present
  const claimNotesStored = String(row[19] ?? '').trim()
  const problemField = claimNotesStored
    ? `${String(row[5] ?? '')} — ${claimNotesStored}`
    : String(row[5] ?? '')

  // Write to All_Visits
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${ALL_VISITS}!A:AC`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        today,
        'Repair',
        by,
        String(row[2] ?? ''), // building
        String(row[3] ?? ''), // unitId
        '',                    // areaType
        String(row[4] ?? ''), // areaName
        'Repair',              // visitType — was 'Work Order', fixed
        '',                    // timeIn
        '',                    // timeOut
        duration,
        problemField,          // problem = description + claim notes
        notes,                 // workPerformed (after notes)
        String(row[6] ?? ''), // priority
        'Completed',
        materialCost,
        ...photoArr,
      ]],
    },
  })
}

export async function approveReportedWorkOrder(id: string): Promise<void> {
  const sheets = await getSheetsClient()
  const { sheetRow } = await findWorkOrderRow(id)
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!I${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['Pending']] },
  })
}

export async function rejectWorkOrder(id: string, reason: string): Promise<void> {
  const sheets = await getSheetsClient()
  const { sheetRow } = await findWorkOrderRow(id)
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!I${sheetRow}:Q${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['Rejected', '', '', '', '', '', '', '', reason]] },
  })
}
