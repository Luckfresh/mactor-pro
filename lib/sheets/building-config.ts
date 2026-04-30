import { getSheetsClient, SPREADSHEET_ID, toNumber, toBoolean } from './client'
import type { BuildingConfig } from '@/types'

const SHEET = 'Building_Config'

export async function getBuildingConfigs(): Promise<BuildingConfig[]> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A2:E100`,
  })

  const rows = res.data.values ?? []

  return rows
    .filter(row => row[0])
    .map(row => ({
      buildingName: String(row[0] ?? '').trim(),
      hoursPerCycle: toNumber(row[1]),
      cycleDayStart: toNumber(row[2]) || 1,
      managerEmail: String(row[3] ?? '').trim(),
      active: toBoolean(row[4]),
    }))
    .filter(b => b.active)
}

export async function getBuildingConfig(buildingName: string): Promise<BuildingConfig | null> {
  const all = await getBuildingConfigs()
  return all.find(b => b.buildingName === buildingName) ?? null
}
