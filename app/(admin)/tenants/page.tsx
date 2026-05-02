import { auth } from '@/lib/auth/config'
import { getTenantReports } from '@/lib/sheets/tenant-reports'
import { TenantReportActions } from '@/components/admin/TenantReportActions'
import Link from 'next/link'

const URGENCY_COLOR: Record<string, string> = {
  Low: 'text-slate-400', Medium: 'text-blue-400',
  High: 'text-amber-400', Emergency: 'text-red-400',
}

export default async function TenantsPage() {
  const session = await auth()
  const all = await getTenantReports()
  const reports = session?.user.role === 'admin'
    ? all
    : all.filter(r => (session?.user.buildings ?? []).includes(r.building))

  const pending = reports.filter(r => r.status === 'Pending')
  const resolved = reports.filter(r => r.status !== 'Pending').slice(0, 30)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="text-slate-400 text-sm hover:text-white">← Dashboard</Link>
          <h1 className="text-white text-2xl font-bold mt-2">Tenant Reports</h1>
          <p className="text-slate-400 text-sm mt-1">
            {pending.length} pending · {resolved.length} resolved
          </p>
        </div>
      </div>

      {pending.length === 0 && (
        <div className="bg-slate-800 rounded-xl p-8 text-center mb-6">
          <p className="text-green-400 font-semibold">All caught up ✓</p>
          <p className="text-slate-400 text-sm mt-1">No pending tenant reports.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="bg-slate-800 rounded-xl overflow-hidden mb-8">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">Pending Review</h2>
          </div>
          {pending.map(r => (
            <div key={r.reportId} className="px-4 py-4 border-b border-slate-700/50 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-xs font-medium">{r.unitId}</span>
                    <span className="text-slate-500 text-xs">·</span>
                    <span className="text-slate-400 text-xs">{r.building.replace('PHASE ', 'P')}</span>
                    <span className={`text-xs font-semibold ${URGENCY_COLOR[r.urgency] ?? 'text-slate-400'}`}>
                      {r.urgency}
                    </span>
                    {r.wantsQuote && (
                      <span className="text-xs bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded">private quote</span>
                    )}
                  </div>
                  <p className="text-white text-sm mb-1">{r.description}</p>
                  <p className="text-slate-500 text-xs">{r.tenantName} · {r.phone || r.email} · {r.date}</p>
                </div>
                <div className="flex-shrink-0">
                  <TenantReportActions report={r} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="bg-slate-800 rounded-xl overflow-hidden opacity-70">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">Recent History</h2>
          </div>
          {resolved.map(r => (
            <div key={r.reportId} className="grid grid-cols-[1fr_80px_80px] gap-2 px-4 py-3 border-b border-slate-700/50 last:border-0 items-center">
              <div>
                <p className="text-slate-300 text-xs">{r.description}</p>
                <p className="text-slate-600 text-xs">{r.tenantName} · {r.unitId} · {r.date}</p>
              </div>
              <span className="text-slate-400 text-xs">{r.building.replace('PHASE ', 'P')}</span>
              <span className={`text-xs font-medium ${
                r.status === 'Resolved' ? 'text-green-400' :
                r.status === 'Approved' ? 'text-blue-400' :
                r.status === 'Rejected' ? 'text-red-400' : 'text-purple-400'
              }`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
