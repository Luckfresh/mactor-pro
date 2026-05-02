import { getSheetsClient, getSpreadsheetId } from './client'

const SHEET = 'Inspections'

export interface InspectionData {
  building: string
  unitId: string
  areaName: string
  areaType: string
  visitType: string
  tenantPresent: boolean
  tenantName: string
  technician: string
  cycleLabel: string
  commonAreas_status: string
  commonAreas_notes: string
  exterior_status: string
  exterior_notes: string
  windows_status: string
  windows_notes: string
  walls_status: string
  walls_notes: string
  bathroom_status: string
  bathroom_notes: string
  kitchen_status: string
  kitchen_notes: string
  floor_status: string
  floor_notes: string
  electrical_status: string
  electrical_notes: string
  plumbing_status: string
  plumbing_notes: string
  hvac_status: string
  hvac_notes: string
  safety_status: string
  safety_notes: string
  totalIssues: number
  urgentIssues: number
}

export interface InspectionRecord {
  id: string
  date: string
  building: string
  unitId: string
  areaName: string
  areaType: string
  technician: string
  cycleLabel: string
  totalIssues: number
  urgentIssues: number
}

function rowToRecord(row: unknown[]): InspectionRecord {
  return {
    id: String(row[0] ?? '').trim(),
    date: String(row[1] ?? '').trim(),
    building: String(row[2] ?? '').trim(),
    unitId: String(row[3] ?? '').trim(),
    areaName: String(row[4] ?? '').trim(),
    areaType: String(row[5] ?? '').trim(),
    technician: String(row[9] ?? '').trim(),
    cycleLabel: String(row[10] ?? '').trim(),
    totalIssues: parseInt(String(row[33] ?? '0')) || 0,
    urgentIssues: parseInt(String(row[34] ?? '0')) || 0,
  }
}

export async function getInspections(filters?: {
  building?: string
  limit?: number
}): Promise<InspectionRecord[]> {
  try {
    const sheets = await getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${SHEET}!A2:AI`,
    })
    const rows = res.data.values ?? []
    let records = rows
      .filter(row => row.length >= 2 && row[0])
      .map(rowToRecord)
      .filter(r => !filters?.building || r.building === filters.building)
      .sort((a, b) => b.date.localeCompare(a.date))
    if (filters?.limit) records = records.slice(0, filters.limit)
    return records
  } catch {
    return []
  }
}

export async function createInspection(data: InspectionData): Promise<void> {
  const sheets = await getSheetsClient()
  const id = `INS-${Date.now()}`
  const today = new Date().toISOString().split('T')[0]

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A:AI`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        id, today, data.building, data.unitId, data.areaName, data.areaType,
        data.visitType, data.tenantPresent ? 'Yes' : 'No', data.tenantName,
        data.technician, data.cycleLabel,
        data.commonAreas_status, data.commonAreas_notes,
        data.exterior_status, data.exterior_notes,
        data.windows_status, data.windows_notes,
        data.walls_status, data.walls_notes,
        data.bathroom_status, data.bathroom_notes,
        data.kitchen_status, data.kitchen_notes,
        data.floor_status, data.floor_notes,
        data.electrical_status, data.electrical_notes,
        data.plumbing_status, data.plumbing_notes,
        data.hvac_status, data.hvac_notes,
        data.safety_status, data.safety_notes,
        data.totalIssues, data.urgentIssues,
      ]],
    },
  })
}
