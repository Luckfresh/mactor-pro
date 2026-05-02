'use client'

import { useActionState } from 'react'
import { actionCreateWorkOrder } from '@/app/(admin)/work-orders/actions'
import Link from 'next/link'

const BUILDINGS = ['PHASE I 72 Isabella', 'PHASE II Church', 'PHASE III Wellesley']
const PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'] as const

export default function NewWorkOrderPage() {
  const [error, formAction, isPending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try { await actionCreateWorkOrder(formData); return null }
      catch (e) { return e instanceof Error ? e.message : 'Error creating work order' }
    },
    null
  )

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/work-orders" className="text-slate-500 text-sm hover:text-slate-700">← Work Orders</Link>
        <h1 className="text-slate-900 text-2xl font-bold mt-2">New Work Order</h1>
        <p className="text-slate-500 text-sm mt-1">Create a work order for any building.</p>
      </div>

      <form action={formAction} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Building</label>
          <select name="building" required
            className="w-full bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Select building...</option>
            {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Unit ID</label>
            <input name="unitId" required placeholder="e.g. U-04"
              className="w-full bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Area Name</label>
            <input name="areaName" placeholder="e.g. Kitchen"
              className="w-full bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
          <textarea name="description" required rows={3} placeholder="Describe the issue or work needed..."
            className="w-full bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 resize-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Priority</label>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITIES.map(p => (
              <label key={p} className="flex flex-col items-center gap-1.5 cursor-pointer">
                <input type="radio" name="priority" value={p} className="sr-only peer" defaultChecked={p === 'Medium'} />
                <div className={`w-full text-center py-2 rounded-lg text-xs font-semibold border transition-colors peer-checked:ring-2 peer-checked:ring-indigo-500 ${
                  p === 'Low'       ? 'bg-green-50 text-green-700 border-green-200 peer-checked:bg-green-100' :
                  p === 'Medium'    ? 'bg-amber-50 text-amber-700 border-amber-200 peer-checked:bg-amber-100' :
                  p === 'High'      ? 'bg-orange-50 text-orange-700 border-orange-200 peer-checked:bg-orange-100' :
                                      'bg-red-50 text-red-700 border-red-200 peer-checked:bg-red-100'
                }`}>{p}</div>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" disabled={isPending}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors">
          {isPending ? 'Creating…' : 'Create Work Order'}
        </button>
      </form>
    </div>
  )
}
