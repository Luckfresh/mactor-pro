import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { getTenantReports } from '@/lib/sheets/tenant-reports'
import { TenantReportActions } from '@/components/admin/TenantReportActions'

const URGENCY_COLOR: Record<string, string> = {
  Low:       'bg-green-50 text-green-700 border-green-200',
  Medium:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  High:      'bg-amber-50 text-amber-700 border-amber-200',
  Emergency: 'bg-red-50 text-red-700 border-red-200',
}

export default async function TenantsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const all = await getTenantReports()
  const reports = session.user.role === 'admin'
    ? all
    : all.filter(r => (session.user.buildings ?? []).includes(r.building))

  const pending  = reports.filter(r => r.status === 'Pending')
  const resolved = reports.filter(r => r.status !== 'Pending').slice(0, 30)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-slate-900 text-2xl font-bold">Tenant Reports</h1>
        <p className="text-slate-500 text-sm mt-1">
          {pending.length} pending · {resolved.length} resolved
        </p>
      </div>

      {pending.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center mb-6">
          <p className="text-green-600 font-semibold">All caught up ✓</p>
          <p className="text-slate-500 text-sm mt-1">No pending tenant reports.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Review</h2>
          </div>
          {pending.map(r => (
            <div key={r.reportId} className="px-5 py-4 border-b border-gray-100 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-slate-900 text-sm font-semibold">{r.unitId}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 text-xs">{r.building.replace('PHASE ', 'P')}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${URGENCY_COLOR[r.urgency] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {r.urgency}
                    </span>
                    {r.wantsQuote && (
                      <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-semibold">Quote requested</span>
                    )}
                  </div>
                  <p className="text-slate-800 text-sm mb-1">{r.description}</p>
                  <p className="text-slate-400 text-xs">{r.tenantName} · {r.phone || r.email} · {r.date}</p>
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden opacity-75">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent History</h2>
          </div>
          {resolved.map(r => (
            <div key={r.reportId} className="grid grid-cols-[1fr_80px_80px] gap-2 px-5 py-3 border-b border-gray-100 last:border-0 items-center">
              <div>
                <p className="text-slate-700 text-xs font-medium">{r.description}</p>
                <p className="text-slate-400 text-xs">{r.tenantName} · {r.unitId} · {r.date}</p>
              </div>
              <span className="text-slate-500 text-xs">{r.building.replace('PHASE ', 'P')}</span>
              <span className={`text-xs font-semibold ${
                r.status === 'Resolved' ? 'text-green-600' :
                r.status === 'Approved' ? 'text-indigo-600' :
                r.status === 'Rejected' ? 'text-red-600' : 'text-violet-600'
              }`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
