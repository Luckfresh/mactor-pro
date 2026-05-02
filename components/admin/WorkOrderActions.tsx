'use client'

import { useState, useTransition } from 'react'
import {
  actionClaimWorkOrder,
  actionStartWorkOrder,
  actionCompleteWorkOrder,
} from '@/app/(admin)/work-orders/actions'
import type { WorkOrderStatus } from '@/types'

interface Props {
  id: string
  status: WorkOrderStatus
  role: 'admin' | 'manager'
}

export function WorkOrderActions({ id, status, role }: Props) {
  const [isPending, startTransition] = useTransition()
  const [localStatus, setLocalStatus] = useState(status)
  const [completing, setCompleting] = useState(false)
  const [duration, setDuration] = useState('')
  const [materialCost, setMaterialCost] = useState('')
  const [notes, setNotes] = useState('')

  if (role !== 'admin') return null

  function claim() {
    startTransition(async () => {
      await actionClaimWorkOrder(id)
      setLocalStatus('Claimed')
    })
  }

  function start() {
    startTransition(async () => {
      await actionStartWorkOrder(id)
      setLocalStatus('In Progress')
    })
  }

  function complete() {
    const dur = parseFloat(duration)
    const cost = parseFloat(materialCost || '0')
    if (!dur || dur <= 0) return
    startTransition(async () => {
      await actionCompleteWorkOrder(id, dur, cost, notes)
      setLocalStatus('Completed')
      setCompleting(false)
    })
  }

  if (localStatus === 'Completed') {
    return <span className="text-green-400 text-xs font-semibold">✓ Done</span>
  }

  if (localStatus === 'Pending') {
    return (
      <button
        disabled={isPending}
        onClick={claim}
        className="text-xs px-3 py-1 rounded bg-sky-700/40 text-sky-300 hover:bg-sky-700/70 transition-colors disabled:opacity-40"
      >
        {isPending ? '...' : 'Claim'}
      </button>
    )
  }

  if (localStatus === 'Claimed') {
    return (
      <button
        disabled={isPending}
        onClick={start}
        className="text-xs px-3 py-1 rounded bg-amber-700/40 text-amber-300 hover:bg-amber-700/70 transition-colors disabled:opacity-40"
      >
        {isPending ? '...' : 'Start'}
      </button>
    )
  }

  if (localStatus === 'In Progress') {
    if (!completing) {
      return (
        <button
          onClick={() => setCompleting(true)}
          className="text-xs px-3 py-1 rounded bg-green-700/40 text-green-300 hover:bg-green-700/70 transition-colors"
        >
          Complete
        </button>
      )
    }
    return (
      <div className="flex flex-col gap-2 min-w-[200px]">
        <div className="flex gap-2">
          <input
            autoFocus
            type="number"
            min="0.1"
            step="0.1"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="Hours"
            className="w-16 text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 focus:outline-none focus:border-slate-400"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={materialCost}
            onChange={e => setMaterialCost(e.target.value)}
            placeholder="$ Materials"
            className="w-24 text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 focus:outline-none focus:border-slate-400"
          />
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Work performed (optional)"
          rows={2}
          className="text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 focus:outline-none focus:border-slate-400 resize-none w-full"
        />
        <div className="flex gap-2">
          <button
            disabled={isPending || !duration || parseFloat(duration) <= 0}
            onClick={complete}
            className="text-xs px-3 py-1 rounded bg-green-700 text-white hover:bg-green-600 font-semibold transition-colors disabled:opacity-40"
          >
            {isPending ? '...' : 'Submit'}
          </button>
          <button
            onClick={() => setCompleting(false)}
            className="text-xs px-2 py-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return null
}
