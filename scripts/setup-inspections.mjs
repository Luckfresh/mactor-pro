/**
 * Creates the Inspections sheet with headers.
 * Run with: node scripts/setup-inspections.mjs
 */
import { readFileSync } from 'fs'
import { google } from 'googleapis'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(s => s.trim()))
)

const auth = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET)
auth.setCredentials({ refresh_token: env.GOOGLE_REFRESH_TOKEN })
const sheets = google.sheets({ version: 'v4', auth })
const SPREADSHEET_ID = env.SPREADSHEET_ID

async function main() {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const existing = res.data.sheets.map(s => s.properties.title)
  console.log('Existing sheets:', existing.join(', '))

  if (existing.includes('Inspections')) {
    console.log('Inspections already exists — skipping creation')
  } else {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: 'Inspections' } } }] }
    })
    console.log('✓ Created Inspections sheet')
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Inspections!A1:N1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        'inspectionId', 'date', 'building', 'unitId', 'areaType', 'areaName',
        'defectType', 'urgency', 'description', 'estimatedHours', 'notes',
        'technician', 'cycleLabel', 'workOrderId'
      ]]
    }
  })
  console.log('✓ Headers written')
  console.log('\n✅ Done!')
}

main().catch(err => { console.error(err.message); process.exit(1) })
