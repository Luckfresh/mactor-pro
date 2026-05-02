import { getSheetsClient, getSpreadsheetId, parseDateValue, toNumber, toBoolean } from './client'
import type { ReviewEntry } from '@/types'

const SHEET = 'Review_Log'

// Columns: Visit_Key(0) Date(1) Technician(2) Building(3) Unit_ID(4)
//          Area_Name(5) Visit_Type(6) Work_Performed(7) Duration(8)
//          Approved(9) PM_Comments(10) Approved_By(11) Approval_Date(12) Cycle_Label(13)

function rowToReview(row: unknown[]): ReviewEntry {
  return {
    visitKey: String(row[0] ?? '').trim(),
    date: parseDateValue(row[1]),
    technician: String(row[2] ?? '').trim(),
    building: String(row[3] ?? '').trim(),
    unitId: String(row[4] ?? '').trim(),
    areaName: String(row[5] ?? '').trim(),
    visitType: String(row[6] ?? '').trim(),
    workPerformed: String(row[7] ?? '').trim(),
    duration: toNumber(row[8]),
    materialCost: 0,
    approved: toBoolean(row[9]),
    pmComments: String(row[10] ?? '').trim(),
    approvedBy: String(row[11] ?? '').trim(),
    approvalDate: parseDateValue(row[12]),
    cycleLabel: String(row[13] ?? '').trim(),
  }
}

export async function getReviewLog(filters?: {
  building?: string
  cycleLabel?: string
  approved?: boolean
}): Promise<ReviewEntry[]> {
  const sheets = await getSheetsClient()

  let res
  try {
    res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${SHEET}!A2:N`,
    })
  } catch (err) {
    throw new Error(`Failed to read ${SHEET} sheet: ${err instanceof Error ? err.message : String(err)}`)
  }

  const rows = res.data.values ?? []

  return rows
    .filter(row => row.length >= 9 && row[0])
    .map(rowToReview)
    .filter(entry => {
      if (filters?.building && entry.building !== filters.building) return false
      if (filters?.cycleLabel && entry.cycleLabel !== filters.cycleLabel) return false
      if (filters?.approved !== undefined && entry.approved !== filters.approved) return false
      return true
    })
}

export async function approveReviewEntry(
  visitKey: string,
  approvedBy: string,
  comments: string,
  approved: boolean
): Promise<void> {
  const sheets = await getSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET}!A2:A`,
  })
  const keys = res.data.values ?? []
  const rowIdx = keys.findIndex(r => String(r[0] ?? '').trim() === visitKey)
  if (rowIdx === -1) throw new Error(`Visit key not found: ${visitKey}`)

  const sheetRow = rowIdx + 2
  const today = new Date().toISOString().split('T')[0]

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET}!J${sheetRow}:M${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[approved ? 'TRUE' : 'FALSE', comments, approvedBy, today]],
    },
  })
}

export async function getPendingApprovalCount(building?: string, cycleLabel?: string): Promise<number> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A2:N`,
  })
  const rows = res.data.values ?? []
  return rows.filter(row => {
    if (!row[0] || String(row[0]).trim() === '') return false
    if (building && String(row[3] ?? '').trim() !== building) return false
    // Only count entries from the current cycle — historical data is pre-approval-workflow
    if (cycleLabel && String(row[13] ?? '').trim() !== cycleLabel) return false
    const approvedRaw = String(row[9] ?? '').trim().toLowerCase()
    return approvedRaw === 'false' || approvedRaw === 'no' || approvedRaw === '0' || approvedRaw === ''
  }).length
}
