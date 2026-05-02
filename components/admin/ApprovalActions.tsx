'use client'

import { useState, useTransition } from 'react'
import { approveEntry, rejectEntry } from '@/app/(admin)/approvals/actions'

interface Props {
  visitKey: string
}

export function ApprovalActions({ visitKey }: Props) {
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle')
  const [comments, setComments] = useState('')
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)

  function submit(action: 'approve' | 'reject') {
    if (action === 'reject' && !comments.trim()) return
    startTransition(async () => {
      if (action === 'approve') {
        await approveEntry(visitKey, comments)
        setDone('approved')
      } else {
        await rejectEntry(visitKey, comments)
        setDone('rejected')
      }
    })
  }

  if (done === 'approved') {
    return <span className="text-green-600 text-xs font-semibold">✓ Approved</span>
  }
  if (done === 'rejected') {
    return <span className="text-red-600 text-xs font-semibold">✗ Rejected</span>
  }

  if (mode === 'idle') {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setMode('approve')}
          className="bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 font-semibold text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
        >
          Approve
        </button>
        <button
          onClick={() => setMode('reject')}
          className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-semibold text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
        >
          Reject
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 mt-1">
      <textarea
        autoFocus
        value={comments}
        onChange={e => setComments(e.target.value)}
        placeholder={mode === 'reject' ? 'Reason for rejection (required)' : 'Comments (optional)'}
        rows={2}
        className="bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 w-full resize-none"
      />
      <div className="flex gap-2">
        <button
          disabled={isPending || (mode === 'reject' && !comments.trim())}
          onClick={() => submit(mode)}
          className={`font-semibold text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
            mode === 'approve'
              ? 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isPending ? '...' : mode === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
        </button>
        <button
          onClick={() => { setMode('idle'); setComments('') }}
          className="text-slate-500 hover:text-slate-700 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
