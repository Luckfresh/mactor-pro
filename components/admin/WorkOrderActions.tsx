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
            className="bg-white border border-gray-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              disabled={isPending || !rejectReason.trim()}
              onClick={() => startTransition(async () => {
                await actionRejectWorkOrder(id, rejectReason)
                setLocalStatus('Rejected')
              })}
              className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
            >
              {isPending ? '...' : 'Confirm Reject'}
            </button>
            <button onClick={() => setRejecting(false)} className="text-slate-500 hover:text-slate-700 text-xs">Cancel</button>
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
          className="bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
        >
          {isPending ? '...' : 'Approve'}
        </button>
        <button
          disabled={isPending}
          onClick={() => setRejecting(true)}
          className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
        >
          Reject
        </button>
      </div>
    )
  }

  if (localStatus === 'Rejected') {
    return <span className="text-red-600 text-xs font-semibold">✗ Rejected</span>
  }

  if (localStatus === 'Completed') {
    return <span className="text-green-600 text-xs font-semibold">✓ Done</span>
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
        className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
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
        className="bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
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
          className="bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
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
            className="w-16 bg-white border border-gray-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="number" min="0" step="0.01"
            value={materialCost} onChange={e => setMaterialCost(e.target.value)}
            placeholder="$ Materials"
            className="w-24 bg-white border border-gray-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Work performed (optional)"
          rows={2}
          className="bg-white border border-gray-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none w-full"
        />
        <div className="flex gap-2">
          <button
            disabled={isPending || !duration || parseFloat(duration) <= 0}
            onClick={() => startTransition(async () => {
              await actionCompleteWorkOrder(id, parseFloat(duration), parseFloat(materialCost || '0'), notes)
              setLocalStatus('Completed')
              setCompleting(false)
            })}
            className="bg-indigo-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {isPending ? '...' : 'Submit'}
          </button>
          <button onClick={() => setCompleting(false)} className="text-slate-500 hover:text-slate-700 text-xs">Cancel</button>
        </div>
      </div>
    )
  }

  return null
}
