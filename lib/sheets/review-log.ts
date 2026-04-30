import { getSheetsClient, SPREADSHEET_ID, serialDateToISO, toNumber, toBoolean } from './client'
import type { ReviewEntry } from '@/types'

const SHEET = 'Review_Log'

// Columns: Visit_Key(0) Date(1) Technician(2) Building(3) Unit_ID(4)
//          Area_Name(5) Visit_Type(6) Work_Performed(7) Duration(8)
//          Material_Cost(9) Approved(10) PM_Comments(11) Approved_By(12)
//          Approval_Date(13) Cycle_Label(14)

function rowToReview(row: unknown[]): ReviewEntry {
  return {
    visitKey: String(row[0] ?? '').trim(),
    date: serialDateToISO(row[1] as number),
    technician: String(row[2] ?? '').trim(),
    building: String(row[3] ?? '').trim(),
    unitId: String(row[4] ?? '').trim(),
    areaName: String(row[5] ?? '').trim(),
    visitType: String(row[6] ?? '').trim(),
    workPerformed: String(row[7] ?? '').trim(),
    duration: toNumber(row[8]),
    materialCost: toNumber(row[9]),
    approved: toBoolean(row[10]),
    pmComments: String(row[11] ?? '').trim(),
    approvedBy: String(row[12] ?? '').trim(),
    approvalDate: serialDateToISO(row[13] as number),
    cycleLabel: String(row[14] ?? '').trim(),
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
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A2:O`,
    })
  } catch (err) {
    throw new Error(`Failed to read ${SHEET} sheet: ${err instanceof Error ? err.message : String(err)}`)
  }

  const rows = res.data.values ?? []

  return rows
    .filter(row => row.length >= 10 && row[0])
    .map(rowToReview)
    .filter(entry => {
      if (filters?.building && entry.building !== filters.building) return false
      if (filters?.cycleLabel && entry.cycleLabel !== filters.cycleLabel) return false
      if (filters?.approved !== undefined && entry.approved !== filters.approved) return false
      return true
    })
}

export async function getPendingApprovalCount(building?: string): Promise<number> {
  const entries = await getReviewLog({ building, approved: false })
  return entries.filter(e => e.visitKey !== '').length
}
