import { google } from 'googleapis'
import fs from 'fs'

const env = {}
if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
  })
}

const SPREADSHEET_ID = env.SPREADSHEET_ID ?? env.GOOGLE_SHEETS_SPREADSHEET_ID
const CLIENT_ID = env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET
const REFRESH_TOKEN = env.GOOGLE_REFRESH_TOKEN

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET)
auth.setCredentials({ refresh_token: REFRESH_TOKEN })
const sheets = google.sheets({ version: 'v4', auth })

const SHEET_NAME = 'Inspection_Requests'
const HEADERS = [
  'requestId', 'date', 'building', 'unitId', 'areaName',
  'requestedBy', 'notes', 'status', 'startedAt', 'completedAt',
  'durationHours', 'completedBy', 'inspectionId',
]

const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
const sheetExists = spreadsheet.data.sheets.some(s => s.properties.title === SHEET_NAME)

if (!sheetExists) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
    },
  })
  console.log('Sheet created:', SHEET_NAME)
}

await sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: `${SHEET_NAME}!A1:M1`,
  valueInputOption: 'RAW',
  requestBody: { values: [HEADERS] },
})
console.log('Headers set:', HEADERS.join(', '))
