import { auth } from '@/lib/auth/config'
import { getWorkOrders } from '@/lib/sheets/work-orders'
import { WorkOrderActions } from '@/components/admin/WorkOrderActions'
import Link from 'next/link'
import type { WorkOrderStatus } from '@/types'

const STATUS_CHIP: Record<WorkOrderStatus, string> = {
  'Reported':    'bg-purple-900/50 text-purple-300',
  'Pending':     'bg-slate-700 text-slate-300',
  'Claimed':     'bg-sky-900/50 text-sky-300',
  'In Progress': 'bg-amber-900/50 text-amber-300',
  'Completed':   'bg-green-900/50 text-green-300',
  'Rejected':    'bg-red-900/50 text-red-300',
}

const PRIORITY_COLOR: Record<string, string> = {
  'Low':       'text-slate-400',
  'Medium':    'text-blue-400',
  'High':      'text-amber-400',
  'Emergency': 'text-red-400',
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
          <Link href="/" className="text-slate-400 text-sm hover:text-white">← Dashboard</Link>
          <h1 className="text-white text-2xl font-bold mt-2">Work Orders</h1>
          <p className="text-slate-400 text-sm mt-1">
            {active.length} active · {completed.length} recently completed
          </p>
        </div>
        <Link
          href="/work-orders/new"
          className="bg-amber-500 text-slate-900 text-sm font-bold px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors"
        >
          + New Work Order
        </Link>
      </div>

      {active.length === 0 && (
        <div className="bg-slate-800 rounded-xl p-8 text-center mb-6">
          <p className="text-slate-400 text-sm">No active work orders.</p>
        </div>
      )}

      {active.length > 0 && (
        <div className="bg-slate-800 rounded-xl overflow-hidden mb-8">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">Active</h2>
          </div>
          <div className="grid grid-cols-[120px_1fr_100px_80px_1fr] gap-2 px-4 py-2 text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
            <span>Building</span>
            <span>Description</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {active.map(wo => (
            <div
              key={wo.id}
              className="grid grid-cols-[120px_1fr_100px_80px_1fr] gap-2 px-4 py-3 border-b border-slate-700/50 last:border-0 items-start"
            >
              <div>
                <p className="text-white text-xs font-medium leading-tight">{wo.building.replace('PHASE ', 'P')}</p>
                <p className="text-slate-500 text-xs">{wo.unitId || wo.areaName}</p>
              </div>
              <div>
                <p className="text-white text-xs">{wo.description}</p>
                <p className="text-slate-500 text-xs">{wo.createdAt} · {wo.createdBy}</p>
              </div>
              <span className={`text-xs font-semibold pt-1 ${PRIORITY_COLOR[wo.priority] ?? 'text-slate-400'}`}>
                {wo.priority}
              </span>
              <div className="pt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CHIP[wo.status]}`}>
                  {wo.status}
                </span>
                {wo.claimedBy && (
                  <p className="text-slate-600 text-xs mt-0.5">{wo.claimedBy}</p>
                )}
              </div>
              <WorkOrderActions id={wo.id} status={wo.status} role={role} />
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">Recently Completed</h2>
          </div>
          <div className="grid grid-cols-[120px_1fr_60px_80px_80px] gap-2 px-4 py-2 text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
            <span>Building</span>
            <span>Description</span>
            <span>Hours</span>
            <span>Materials</span>
            <span>Done</span>
          </div>
          {completed.map(wo => (
            <div
              key={wo.id}
              className="grid grid-cols-[120px_1fr_60px_80px_80px] gap-2 px-4 py-3 text-sm border-b border-slate-700/50 last:border-0 items-center opacity-70"
            >
              <p className="text-slate-300 text-xs">{wo.building.replace('PHASE ', 'P')}</p>
              <div>
                <p className="text-white text-xs">{wo.description}</p>
                {wo.notes && <p className="text-slate-500 text-xs truncate">{wo.notes}</p>}
              </div>
              <span className="text-white text-xs">{wo.duration.toFixed(1)}h</span>
              <span className="text-slate-300 text-xs">${wo.materialCost.toFixed(2)}</span>
              <span className="text-slate-400 text-xs">{wo.completedAt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
