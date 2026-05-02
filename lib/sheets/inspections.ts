import { getSheetsClient, getSpreadsheetId } from './client'

const SHEET = 'Inspections'

export async function createInspection(data: {
  building: string
  unitId: string
  areaType: string
  areaName: string
  defectType: string
  urgency: string
  description: string
  estimatedHours: number
  notes: string
  technician: string
  cycleLabel: string
  workOrderId: string
}): Promise<void> {
  const sheets = await getSheetsClient()
  const id = `INS-${Date.now()}`
  const today = new Date().toISOString().split('T')[0]

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A:N`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        id, today, data.building, data.unitId, data.areaType, data.areaName,
        data.defectType, data.urgency, data.description, data.estimatedHours,
        data.notes, data.technician, data.cycleLabel, data.workOrderId,
      ]],
    },
  })
}
