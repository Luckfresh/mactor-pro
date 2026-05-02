/**
 * Creates Work_Orders sheet with headers.
 * Run with: node scripts/setup-work-orders.mjs
 */
import { google } from 'googleapis'

import 'dotenv/config'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET)
auth.setCredentials({ refresh_token: REFRESH_TOKEN })
const sheets = google.sheets({ version: 'v4', auth })

async function main() {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const existing = res.data.sheets.map(s => s.properties.title)
  console.log('Existing sheets:', existing.join(', '))

  if (existing.includes('Work_Orders')) {
    console.log('Work_Orders already exists — skipping creation')
  } else {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: 'Work_Orders' } } }] }
    })
    console.log('✓ Created Work_Orders sheet')
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Work_Orders!A1:Q1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        'workOrderId', 'createdAt', 'building', 'unitId', 'areaName',
        'description', 'priority', 'createdBy', 'status', 'claimedBy',
        'claimedAt', 'startedAt', 'completedAt', 'duration', 'materialCost',
        'cycleLabel', 'notes'
      ]]
    }
  })
  console.log('✓ Headers written to Work_Orders')
  console.log('\n✅ Done!')
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
