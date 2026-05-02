/**
 * Creates Tenant_Reports sheet with headers.
 * Run with: node scripts/setup-tenant-reports.mjs
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

  if (existing.includes('Tenant_Reports')) {
    console.log('Tenant_Reports already exists — skipping creation')
  } else {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: 'Tenant_Reports' } } }] }
    })
    console.log('✓ Created Tenant_Reports sheet')
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Tenant_Reports!A1:O1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        'reportId', 'date', 'building', 'unitId', 'tenantName',
        'phone', 'email', 'description', 'urgency', 'status',
        'wantsQuote', 'serviceType', 'quotedAmount', 'adminNotes', 'resolvedDate'
      ]]
    }
  })
  console.log('✓ Headers written\n✅ Done!')
}

main().catch(err => { console.error(err.message); process.exit(1) })
