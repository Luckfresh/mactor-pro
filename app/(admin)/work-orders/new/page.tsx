'use client'

import { useActionState } from 'react'
import { actionCreateWorkOrder } from '@/app/(admin)/work-orders/actions'
import Link from 'next/link'

const BUILDINGS = [
  'PHASE I 72 Isabella',
  'PHASE II Church',
  'PHASE III Wellesley',
]

const PRIORITIES = ['Low', 'Medium', 'High', 'Emergency']

const initialState = { error: '' }

function FormAction(_prev: typeof initialState, formData: FormData) {
  return actionCreateWorkOrder(formData).then(() => initialState).catch(e => ({ error: String(e) }))
}

export default function NewWorkOrderPage() {
  const [state, action, isPending] = useActionState(FormAction, initialState)

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/work-orders" className="text-slate-400 text-sm hover:text-white">← Work Orders</Link>
        <h1 className="text-white text-2xl font-bold mt-2">New Work Order</h1>
        <p className="text-slate-400 text-sm mt-1">Work orders go directly into the active queue.</p>
      </div>

      <form action={action} className="bg-slate-800 rounded-xl p-6 flex flex-col gap-5">
        <div>
          <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1">Building *</label>
          <select
            name="building"
            required
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-sky-500"
          >
            <option value="">Select building…</option>
            {BUILDINGS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1">Unit / Area</label>
            <input
              name="unitId"
              type="text"
              placeholder="e.g. 201, Lobby, Roof"
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1">Area Name</label>
            <input
              name="areaName"
              type="text"
              placeholder="e.g. Master Bath"
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1">Description *</label>
          <textarea
            name="description"
            required
            rows={3}
            placeholder="Describe the work needed…"
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-sky-500 placeholder:text-slate-600 resize-none"
          />
        </div>

        <div>
          <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1">Priority</label>
          <div className="flex gap-2">
            {PRIORITIES.map(p => (
              <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="priority" value={p} defaultChecked={p === 'Medium'} className="accent-amber-500" />
                <span className="text-sm text-slate-300">{p}</span>
              </label>
            ))}
          </div>
        </div>

        {state?.error && (
          <p className="text-red-400 text-sm">{state.error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="bg-amber-500 text-slate-900 font-bold text-sm px-6 py-2 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-40"
          >
            {isPending ? 'Creating…' : 'Create Work Order'}
          </button>
          <Link
            href="/work-orders"
            className="text-slate-400 text-sm px-4 py-2 hover:text-white transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
