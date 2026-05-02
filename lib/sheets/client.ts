import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
)
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
})

export async function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: oauth2Client })
}

export function getSpreadsheetId(): string {
  const id = process.env.SPREADSHEET_ID
  if (!id) throw new Error('Missing required environment variable: SPREADSHEET_ID')
  return id
}

// Convert a Sheets serial date number to ISO string
export function serialDateToISO(serial: number | string): string {
  if (serial === '' || serial === null || serial === undefined) return ''
  const num = typeof serial === 'string' ? parseFloat(serial) : serial
  if (isNaN(num) || num <= 0) return ''
  // Google Sheets serial: days since Dec 30 1899
  const date = new Date((num - 25569) * 86400 * 1000)
  return date.toISOString().split('T')[0]
}

export function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  // Handle European locale: "$340,00" → 340, "4,5" → 4.5
  const cleaned = String(value)
    .replace(/[$\s]/g, '')
    .replace(/\.(?=\d{3}[,\.])/g, '')  // remove thousands dot: "1.234,5" → "1234,5"
    .replace(',', '.')                   // decimal comma → dot
  const n = parseFloat(cleaned)
  return isFinite(n) ? n : 0
}

// Parses both "dd/mm/yyyy" string dates and Excel serial numbers
export function parseDateValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  const s = String(value).trim()
  if (s === '0') return ''
  // dd/mm/yyyy or dd/m/yyyy
  if (s.includes('/')) {
    const parts = s.split('/')
    if (parts.length === 3) {
      const [d, m, y] = parts
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
  }
  // Excel serial number
  const num = parseFloat(s)
  if (!isNaN(num) && num > 1000) return serialDateToISO(num)
  return s
}

export function toBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (typeof value === 'string') {
    return ['true', 'yes', 'y', '1', 'on'].includes(value.toLowerCase())
  }
  return false
}
