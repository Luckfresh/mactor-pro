import { getSheetsClient, getSpreadsheetId, toNumber, toBoolean } from './client'
import type { BuildingConfig } from '@/types'

const SHEET = 'Building_Config'

export async function getBuildingConfigs(): Promise<BuildingConfig[]> {
  const sheets = await getSheetsClient()

  let res
  try {
    res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${SHEET}!A2:F`,
    })
  } catch (err) {
    throw new Error(`Failed to read ${SHEET} sheet: ${err instanceof Error ? err.message : String(err)}`)
  }

  const rows = res.data.values ?? []

  return rows
    .filter(row => row[0] && row.length >= 5)
    .map(row => ({
      buildingName: String(row[0] ?? '').trim(),
      hoursPerCycle: toNumber(row[1]),
      cycleDayStart: toNumber(row[2]) || 25,
      managerEmail: String(row[3] ?? '').trim(),
      active: toBoolean(row[4]),
      clientId: String(row[5] ?? '').trim(),
    }))
    .filter(b => b.active)
}

export async function getBuildingConfig(buildingName: string): Promise<BuildingConfig | null> {
  const all = await getBuildingConfigs()
  return all.find(b => b.buildingName === buildingName) ?? null
}
