import { auth } from '@/lib/auth/config'
import { getWorkOrders } from '@/lib/sheets/work-orders'
import { WorkOrderActions } from '@/components/admin/WorkOrderActions'
import Link from 'next/link'
import type { WorkOrderStatus } from '@/types'

const STATUS_CHIP: Record<WorkOrderStatus, string> = {
  'Reported':    'bg-purple-50 text-purple-700 border border-purple-200',
  'Pending':     'bg-indigo-50 text-indigo-700 border border-indigo-200',
  'Claimed':     'bg-sky-50 text-sky-700 border border-sky-200',
  'In Progress': 'bg-orange-50 text-orange-700 border border-orange-200',
  'Completed':   'bg-green-50 text-green-700 border border-green-200',
  'Rejected':    'bg-red-50 text-red-700 border border-red-200',
}

const PRIORITY_COLOR: Record<string, string> = {
  'Low':       'text-green-700',
  'Medium':    'text-amber-700',
  'High':      'text-orange-700',
  'Emergency': 'text-red-700',
}

export default async function WorkOrdersPage() {
  const session = await auth()
  const role = session?.user.role ?? 'manager'

  const allOrders = await getWorkOrders()
  const orders = role === 'admin'
    ? allOrders
    : allOrders.filter(wo => (session?.user.buildings ?? []).includes(wo.building))

  const active = orders.filter(wo => wo.status !== 'Completed')
  const completed = orders.filter(wo => wo.status === 'Completed').slice(0, 20)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl font-bold">Work Orders</h1>
          <p className="text-slate-500 text-sm mt-1">
            {active.length} active · {completed.length} recently completed
          </p>
        </div>
        <Link
          href="/work-orders/new"
          className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Work Order
        </Link>
      </div>

      {active.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center mb-6">
          <p className="text-slate-500 text-sm">No active work orders.</p>
        </div>
      )}

      {active.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Work Orders</h2>
          </div>
          <div className="grid grid-cols-[120px_1fr_100px_80px_1fr] gap-2 px-4 py-2 text-slate-500 text-xs uppercase tracking-wide border-b border-gray-100">
            <span>Building</span>
            <span>Description</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {active.map(wo => (
            <div
              key={wo.id}
              className="grid grid-cols-[120px_1fr_100px_80px_1fr] gap-2 px-4 py-3 border-b border-gray-100 last:border-0 items-start"
            >
              <div>
                <p className="text-slate-900 text-sm font-semibold leading-tight">{wo.building.replace('PHASE ', 'P')}</p>
                <p className="text-slate-500 text-xs">{wo.unitId || wo.areaName}</p>
              </div>
              <div>
                <p className="text-slate-900 text-sm font-semibold">{wo.description}</p>
                <p className="text-slate-500 text-xs">{wo.createdAt} · {wo.createdBy}</p>
              </div>
              <span className={`text-xs font-semibold pt-1 ${PRIORITY_COLOR[wo.priority] ?? 'text-slate-500'}`}>
                {wo.priority}
              </span>
              <div className="pt-1">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_CHIP[wo.status]}`}>
                  {wo.status}
                </span>
                {wo.claimedBy && (
                  <p className="text-slate-500 text-xs mt-0.5">{wo.claimedBy}</p>
                )}
              </div>
              <WorkOrderActions id={wo.id} status={wo.status} role={role} />
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recently Completed</h2>
          </div>
          <div className="grid grid-cols-[120px_1fr_60px_80px_80px] gap-2 px-4 py-2 text-slate-500 text-xs uppercase tracking-wide border-b border-gray-100">
            <span>Building</span>
            <span>Description</span>
            <span>Hours</span>
            <span>Materials</span>
            <span>Done</span>
          </div>
          {completed.map(wo => (
            <div
              key={wo.id}
              className="grid grid-cols-[120px_1fr_60px_80px_80px] gap-2 px-4 py-3 border-b border-gray-100 last:border-0 items-center"
            >
              <p className="text-slate-900 text-sm font-semibold">{wo.building.replace('PHASE ', 'P')}</p>
              <div>
                <p className="text-slate-900 text-sm font-semibold">{wo.description}</p>
                {wo.notes && <p className="text-slate-500 text-xs truncate">{wo.notes}</p>}
              </div>
              <span className="text-slate-900 text-sm font-semibold">{wo.duration.toFixed(1)}h</span>
              <span className="text-slate-500 text-xs">${wo.materialCost.toFixed(2)}</span>
              <span className="text-slate-500 text-xs">{wo.completedAt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
