// Run once: node scripts/get-google-token.mjs
// Abre el navegador, autoriza, e imprime el refresh token

import { createServer } from 'http'
import { google } from 'googleapis'
import { exec } from 'child_process'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = 'http://localhost:9999/callback'

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌ Faltan variables de entorno:')
  console.error('   GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET deben estar en .env.local\n')
  process.exit(1)
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
  ],
})

const server = createServer(async (req, res) => {
  if (!req.url?.startsWith('/callback')) return
  const code = new URL(req.url, 'http://localhost:9999').searchParams.get('code')
  if (!code) {
    res.end('<h2>❌ No se recibió código</h2>')
    return
  }
  try {
    const { tokens } = await oauth2Client.getToken(code)
    res.end('<h2 style="font-family:sans-serif;color:green">✅ ¡Autorización exitosa! Cierra esta pestaña y mira la terminal.</h2>')
    console.log('\n✅ COPIA ESTOS VALORES A TU .env.local:\n')
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`)
    console.log('\n')
    server.close()
    process.exit(0)
  } catch (e) {
    res.end('<h2>❌ Error obteniendo token</h2>')
    console.error(e)
    server.close()
    process.exit(1)
  }
})

server.listen(9999, () => {
  console.log('\n🌐 Abriendo navegador para autorizar...\n')
  const open = process.platform === 'win32' ? `start "${authUrl}"` : `open "${authUrl}"`
  exec(open)
  console.log('Si el navegador no abrió, ve a esta URL manualmente:')
  console.log(authUrl)
  console.log('\nEsperando autorización...\n')
})
