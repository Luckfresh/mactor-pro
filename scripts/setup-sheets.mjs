/**
 * Creates Client_Plans and Cycle_Balances sheets and adds clientId column to Building_Config.
 * Run with: node scripts/setup-sheets.mjs
 */
import { google } from 'googleapis'
import fs from 'fs'

const env = {}
if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
  })
}

const CLIENT_ID = env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET
const REFRESH_TOKEN = env.GOOGLE_REFRESH_TOKEN
const SPREADSHEET_ID = env.SPREADSHEET_ID ?? env.GOOGLE_SHEETS_SPREADSHEET_ID

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET)
auth.setCredentials({ refresh_token: REFRESH_TOKEN })
const sheets = google.sheets({ version: 'v4', auth })

async function getExistingSheets() {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  return res.data.sheets.map(s => ({ title: s.properties.title, id: s.properties.sheetId }))
}

async function addSheet(title) {
  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title } } }]
    }
  })
  const newSheet = res.data.replies[0].addSheet.properties
  console.log(`✓ Created sheet: ${title} (id=${newSheet.sheetId})`)
  return newSheet.sheetId
}

async function writeRange(range, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  })
  console.log(`✓ Wrote ${values.length} row(s) to ${range}`)
}

async function appendColumn(sheetTitle, headerValue, dataValues) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetTitle}!1:1`
  })
  const existingHeaders = res.data.values?.[0] ?? []

  const existingIdx = existingHeaders.findIndex(h => h === headerValue)
  if (existingIdx !== -1) {
    console.log(`  Column "${headerValue}" already exists in ${sheetTitle} at col ${existingIdx + 1}`)
    return existingIdx
  }

  const colIdx = existingHeaders.length
  const colLetter = String.fromCharCode(65 + colIdx)

  const allValues = [[headerValue], ...dataValues.map(v => [v])]
  await writeRange(`${sheetTitle}!${colLetter}1`, allValues)
  console.log(`✓ Added column "${headerValue}" at ${colLetter} in ${sheetTitle}`)
  return colIdx
}

async function main() {
  console.log('Reading existing sheets...')
  const existing = await getExistingSheets()
  const existingTitles = existing.map(s => s.title)
  console.log('Existing:', existingTitles.join(', '))

  if (existingTitles.includes('Client_Plans')) {
    console.log('  Client_Plans already exists — skipping creation')
  } else {
    await addSheet('Client_Plans')
  }

  await writeRange('Client_Plans!A1:F2', [
    ['clientId', 'clientName', 'managerEmail', 'buildings', 'hoursPerCycle', 'active'],
    [
      'eddie',
      'Eddie M.',
      'eddie@mactorconstruction.com',
      'PHASE I 72 Isabella, PHASE II Church, PHASE III Wellesley',
      '40',
      'TRUE'
    ]
  ])

  if (existingTitles.includes('Cycle_Balances')) {
    console.log('  Cycle_Balances already exists — skipping creation')
  } else {
    await addSheet('Cycle_Balances')
  }

  await writeRange('Cycle_Balances!A1:H1', [[
    'clientId', 'cycleLabel', 'plannedHours', 'usedHours',
    'rolledOverIn', 'rolledOverOut', 'extraHours', 'closedAt'
  ]])

  const bcRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Building_Config!A2:A'
  })
  const buildingRows = bcRes.data.values ?? []
  console.log(`Building_Config has ${buildingRows.length} data row(s)`)

  const clientIds = buildingRows.map(() => 'eddie')
  await appendColumn('Building_Config', 'clientId', clientIds)

  console.log('\n✅ All done!')
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
