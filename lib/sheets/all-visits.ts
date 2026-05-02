import { getSheetsClient, getSpreadsheetId, parseDateValue, toNumber } from './client'
import type { Visit, VisitPhotos, VisitSource, VisitStatus } from '@/types'

const SHEET = 'All_Visits'

// Columns: Date(0) Source(1) Technician(2) Building(3) Unit_ID(4) Area_Type(5)
//          Area_Name(6) Visit_Type(7) Time_In(8) Time_Out(9) Duration(10)
//          Problem(11) Work_Performed(12) Priority(13) Status(14) Material_Cost(15)
//          Common(16) Exterior(17) Windows(18) WallCeiling(19) Bath(20)
//          Kitchen(21) Floor(22) Electrical(23) Plumbing(24) HVAC(25) Extra(26)
//          Before(27) After(28)

function photoUrl(val: unknown): string | null {
  const s = String(val ?? '').trim()
  return s === '' || s === '0' ? null : s
}

function rowToVisit(row: unknown[]): Visit {
  return {
    date: parseDateValue(row[0]),
    source: String(row[1] ?? '').trim() as VisitSource,
    technician: String(row[2] ?? '').trim(),
    building: String(row[3] ?? '').trim(),
    unitId: String(row[4] ?? '').trim(),
    areaType: String(row[5] ?? '').trim(),
    areaName: String(row[6] ?? '').trim(),
    visitType: String(row[7] ?? '').trim(),
    timeIn: String(row[8] ?? ''),
    timeOut: String(row[9] ?? ''),
    duration: toNumber(row[10]),
    problem: String(row[11] ?? '').trim(),
    workPerformed: String(row[12] ?? '').trim(),
    priority: String(row[13] ?? '').trim(),
    status: String(row[14] ?? '').trim() as VisitStatus,
    materialCost: toNumber(row[15]),
    photos: {
      common: photoUrl(row[16]),
      exterior: photoUrl(row[17]),
      windows: photoUrl(row[18]),
      wallCeiling: photoUrl(row[19]),
      bath: photoUrl(row[20]),
      kitchen: photoUrl(row[21]),
      floor: photoUrl(row[22]),
      electrical: photoUrl(row[23]),
      plumbing: photoUrl(row[24]),
      hvac: photoUrl(row[25]),
      extra: photoUrl(row[26]),
      before: photoUrl(row[27]),
      after: photoUrl(row[28]),
    } satisfies VisitPhotos,
  }
}

export async function getAllVisits(filters?: {
  building?: string
  unitId?: string
  source?: string
}): Promise<Visit[]> {
  const sheets = await getSheetsClient()

  let res
  try {
    res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${SHEET}!A2:AC`,
    })
  } catch (err) {
    throw new Error(`Failed to read ${SHEET} sheet: ${err instanceof Error ? err.message : String(err)}`)
  }

  const rows = res.data.values ?? []

  return rows
    .filter(row => row.length >= 4 && row[0] && row[3])
    .map(rowToVisit)
    .filter(v => {
      if (filters?.building && v.building !== filters.building) return false
      if (filters?.unitId && v.unitId !== filters.unitId) return false
      if (filters?.source && v.source !== filters.source) return false
      return true
    })
}

export async function getRecentVisits(limit = 10): Promise<Visit[]> {
  const all = await getAllVisits()
  return all
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}
