'use client'

import { useState, useTransition } from 'react'
import {
  actionClaimWorkOrder,
  actionStartWorkOrder,
  actionCompleteWorkOrder,
  actionApproveWorkOrder,
  actionRejectWorkOrder,
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
  const [rejecting, setRejecting] = useState(false)
  const [duration, setDuration] = useState('')
  const [materialCost, setMaterialCost] = useState('')
  const [notes, setNotes] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  // Reported: manager approves/rejects; admin sees "Awaiting approval"
  if (localStatus === 'Reported') {
    if (role === 'admin') {
      return <span className="text-slate-500 text-xs italic">Awaiting manager approval</span>
    }
    if (rejecting) {
      return (
        <div className="flex flex-col gap-2 min-w-[200px]">
          <textarea
            autoFocus
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (required)"
            rows={2}
            className="text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 focus:outline-none focus:border-slate-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              disabled={isPending || !rejectReason.trim()}
              onClick={() => startTransition(async () => {
                await actionRejectWorkOrder(id, rejectReason)
                setLocalStatus('Rejected')
              })}
              className="text-xs px-3 py-1 rounded bg-red-700 text-white font-semibold disabled:opacity-40"
            >
              {isPending ? '...' : 'Confirm Reject'}
            </button>
            <button onClick={() => setRejecting(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
          </div>
        </div>
      )
    }
    return (
      <div className="flex gap-2">
        <button
          disabled={isPending}
          onClick={() => startTransition(async () => {
            await actionApproveWorkOrder(id)
            setLocalStatus('Pending')
          })}
          className="text-xs px-3 py-1 rounded bg-green-700/40 text-green-300 hover:bg-green-700/70 transition-colors disabled:opacity-40"
        >
          {isPending ? '...' : 'Approve'}
        </button>
        <button
          onClick={() => setRejecting(true)}
          className="text-xs px-3 py-1 rounded bg-red-900/40 text-red-300 hover:bg-red-900/70 transition-colors"
        >
          Reject
        </button>
      </div>
    )
  }

  if (localStatus === 'Rejected') {
    return <span className="text-red-400 text-xs font-semibold">✗ Rejected</span>
  }

  if (localStatus === 'Completed') {
    return <span className="text-green-400 text-xs font-semibold">✓ Done</span>
  }

  if (role !== 'admin') return null

  if (localStatus === 'Pending') {
    return (
      <button
        disabled={isPending}
        onClick={() => startTransition(async () => {
          await actionClaimWorkOrder(id)
          setLocalStatus('Claimed')
        })}
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
        onClick={() => startTransition(async () => {
          await actionStartWorkOrder(id)
          setLocalStatus('In Progress')
        })}
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
            type="number" min="0.1" step="0.1"
            value={duration} onChange={e => setDuration(e.target.value)}
            placeholder="Hours"
            className="w-16 text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 focus:outline-none focus:border-slate-400"
          />
          <input
            type="number" min="0" step="0.01"
            value={materialCost} onChange={e => setMaterialCost(e.target.value)}
            placeholder="$ Materials"
            className="w-24 text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 focus:outline-none focus:border-slate-400"
          />
        </div>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Work performed (optional)"
          rows={2}
          className="text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 focus:outline-none focus:border-slate-400 resize-none w-full"
        />
        <div className="flex gap-2">
          <button
            disabled={isPending || !duration || parseFloat(duration) <= 0}
            onClick={() => startTransition(async () => {
              await actionCompleteWorkOrder(id, parseFloat(duration), parseFloat(materialCost || '0'), notes)
              setLocalStatus('Completed')
              setCompleting(false)
            })}
            className="text-xs px-3 py-1 rounded bg-green-700 text-white font-semibold disabled:opacity-40"
          >
            {isPending ? '...' : 'Submit'}
          </button>
          <button onClick={() => setCompleting(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
        </div>
      </div>
    )
  }

  return null
}
