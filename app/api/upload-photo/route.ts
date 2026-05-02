import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Readable } from 'stream'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
)
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })

const ROOT_FOLDER_NAME = 'Mactor Pro Photos'

async function findOrCreateFolder(drive: ReturnType<typeof google.drive>, name: string, parentId?: string): Promise<string> {
  const q = [
    `name = '${name.replace(/'/g, "\\'")}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`,
    parentId ? `'${parentId}' in parents` : `'root' in parents`,
  ].join(' and ')

  const res = await drive.files.list({ q, fields: 'files(id)', pageSize: 1 })
  if (res.data.files?.[0]?.id) return res.data.files[0].id

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: 'id',
  })
  return created.data.id!
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const label = String(formData.get('label') ?? 'photo')
    // path = e.g. "Work Orders/WO-1234" or "Inspections/INS-1234"
    const path = String(formData.get('path') ?? '')

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const stream = Readable.from(buffer)
    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    // Build folder hierarchy under root
    const rootId = await findOrCreateFolder(drive, ROOT_FOLDER_NAME)
    let folderId = rootId

    if (path) {
      for (const segment of path.split('/').filter(Boolean)) {
        folderId = await findOrCreateFolder(drive, segment, folderId)
      }
    }

    const res = await drive.files.create({
      requestBody: {
        name: `${label}-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        parents: [folderId],
      },
      media: { mimeType: 'image/jpeg', body: stream },
      fields: 'id',
    })

    await drive.permissions.create({
      fileId: res.data.id!,
      requestBody: { role: 'reader', type: 'anyone' },
    })

    const url = `https://drive.google.com/uc?id=${res.data.id}`
    return NextResponse.json({ url })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
