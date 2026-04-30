import { getSheetsClient, SPREADSHEET_ID, serialDateToISO, toNumber } from './client'
import type { UnitSummary } from '@/types'

const SHEET = 'Units_Sumary'  // note: typo is in the actual sheet name

// Columns: Unit_ID(0) Building(1) Area_Type(2) Area_Name(3) Total_Visits(4)
//          Last_Visit(5) Total_Hours(6) Total_Material_Cost(7)
//          Inspection_Visits(8) Repair_Visits(9)

export async function getUnitsSummary(building?: string): Promise<UnitSummary[]> {
  const sheets = await getSheetsClient()

  let res
  try {
    res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A2:J`,
    })
  } catch (err) {
    throw new Error(`Failed to read ${SHEET} sheet: ${err instanceof Error ? err.message : String(err)}`)
  }

  const rows = res.data.values ?? []

  return rows
    .filter(row => row.length >= 4 && row[0])
    .map(row => ({
      unitId: String(row[0] ?? '').trim(),
      building: String(row[1] ?? '').trim(),
      areaType: String(row[2] ?? '').trim(),
      areaName: String(row[3] ?? '').trim(),
      totalVisits: toNumber(row[4]),
      lastVisit: serialDateToISO(row[5] as number),
      totalHours: toNumber(row[6]),
      totalMaterialCost: toNumber(row[7]),
      inspectionVisits: toNumber(row[8]),
      repairVisits: toNumber(row[9]),
    }))
    .filter(u => !building || u.building === building)
}
