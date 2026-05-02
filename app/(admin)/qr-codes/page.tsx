import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { getUnitsSummary } from '@/lib/sheets/units-summary'
import QRCode from 'qrcode'
import Link from 'next/link'

const BASE_URL = 'https://mactor-pro.vercel.app'

const BUILDING_COLOR: Record<string, string> = {
  'PHASE I 72 Isabella':  'border-blue-700 bg-blue-950/30',
  'PHASE II Church':      'border-green-700 bg-green-950/30',
  'PHASE III Wellesley':  'border-amber-700 bg-amber-950/30',
}

export default async function QRCodesPage() {
  const session = await auth()
  if (session?.user.role !== 'admin') redirect('/')

  const units = await getUnitsSummary()
  const buildings = [...new Set(units.map(u => u.building))].sort()

  const qrByUnit: Record<string, string> = {}
  await Promise.all(
    units.map(async u => {
      const url = `${BASE_URL}/report/${encodeURIComponent(u.building)}/${encodeURIComponent(u.unitId)}`
      qrByUnit[`${u.building}::${u.unitId}`] = await QRCode.toDataURL(url, {
        width: 180,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
    })
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between no-print">
        <div>
          <Link href="/" className="text-slate-400 text-sm hover:text-white">← Dashboard</Link>
          <h1 className="text-white text-2xl font-bold mt-2">QR Codes</h1>
          <p className="text-slate-400 text-sm mt-1">One QR per unit — tenants scan to report issues.</p>
        </div>
        <button
          onClick={() => { if (typeof window !== 'undefined') window.print() }}
          className="bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
        >
          🖨 Print all
        </button>
      </div>

      {buildings.map(building => (
        <div key={building} className="mb-10">
          <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide mb-4">{building}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {units.filter(u => u.building === building).map(u => {
              const src = qrByUnit[`${u.building}::${u.unitId}`]
              const url = `${BASE_URL}/report/${encodeURIComponent(u.building)}/${encodeURIComponent(u.unitId)}`
              return (
                <div
                  key={`${u.building}::${u.unitId}`}
                  className={`rounded-xl border p-4 flex flex-col items-center gap-2 ${BUILDING_COLOR[building] ?? 'border-slate-700 bg-slate-800'}`}
                >
                  {src && (
                    <img src={src} alt={`QR for ${u.unitId}`} width={140} height={140} className="rounded-lg" />
                  )}
                  <p className="text-white text-sm font-semibold text-center">{u.areaName || u.unitId}</p>
                  <p className="text-slate-400 text-xs text-center">{u.unitId}</p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 text-xs hover:underline truncate max-w-full text-center"
                  >
                    Open link
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          * { color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}
