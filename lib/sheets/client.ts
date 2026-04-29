import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly',
  ],
})

export async function getSheetsClient() {
  return google.sheets({ version: 'v4', auth })
}

if (!process.env.SPREADSHEET_ID) {
  throw new Error('Missing required environment variable: SPREADSHEET_ID')
}
export const SPREADSHEET_ID = process.env.SPREADSHEET_ID

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
  const cleaned = String(value).replace(/[$,]/g, '')
  const n = parseFloat(cleaned)
  return isFinite(n) ? n : 0
}

export function toBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (typeof value === 'string') {
    return ['true', 'yes', 'y', '1', 'on'].includes(value.toLowerCase())
  }
  return false
}
