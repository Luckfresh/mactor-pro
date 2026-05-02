import { getSheetsClient, getSpreadsheetId, toNumber, parseDateValue } from './client'
import type { CycleBalance } from '@/types'

const SHEET = 'Cycle_Balances'

// Columns: clientId(0) cycleLabel(1) plannedHours(2) usedHours(3)
//          rolledOverIn(4) rolledOverOut(5) extraHours(6) closedAt(7)
function rowToBalance(row: unknown[]): CycleBalance {
  return {
    clientId: String(row[0] ?? '').trim(),
    cycleLabel: String(row[1] ?? '').trim(),
    plannedHours: toNumber(row[2]),
    usedHours: toNumber(row[3]),
    rolledOverIn: toNumber(row[4]),
    rolledOverOut: toNumber(row[5]),
    extraHours: toNumber(row[6]),
    closedAt: parseDateValue(row[7]),
  }
}

export async function getCycleBalances(clientId: string): Promise<CycleBalance[]> {
  const sheets = await getSheetsClient()
  let res
  try {
    res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${SHEET}!A2:H`,
    })
  } catch {
    return []
  }
  const rows = res.data.values ?? []
  return rows
    .filter(row => row.length >= 7 && row[0])
    .map(rowToBalance)
    .filter(b => b.clientId === clientId)
}
