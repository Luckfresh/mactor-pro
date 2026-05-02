import { getSheetsClient, getSpreadsheetId } from './client'
import type { ClientPlan } from '@/types'

const SHEET = 'Client_Plans'

// Columns: clientId(0) clientName(1) managerEmail(2) buildings(3) hoursPerCycle(4) active(5)
function rowToPlan(row: unknown[]): ClientPlan {
  return {
    clientId: String(row[0] ?? '').trim(),
    clientName: String(row[1] ?? '').trim(),
    managerEmail: String(row[2] ?? '').trim(),
    buildings: String(row[3] ?? '')
      .split(',')
      .map(b => b.trim())
      .filter(Boolean),
    hoursPerCycle: parseFloat(String(row[4] ?? '40')) || 40,
    active: String(row[5] ?? '').toLowerCase() === 'true',
  }
}

export async function getClientPlans(): Promise<ClientPlan[]> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A2:F`,
  })
  const rows = res.data.values ?? []
  return rows
    .filter(row => row.length >= 5 && row[0])
    .map(rowToPlan)
    .filter(p => p.active)
}

export async function getClientPlan(clientId: string): Promise<ClientPlan | null> {
  const plans = await getClientPlans()
  return plans.find(p => p.clientId === clientId) ?? null
}

export async function getClientPlanForBuilding(buildingName: string): Promise<ClientPlan | null> {
  const plans = await getClientPlans()
  return plans.find(p => p.buildings.includes(buildingName)) ?? null
}
