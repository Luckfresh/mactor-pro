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
    return <span className="text-green-400 text-xs font-semibold">✓ Approved</span>
  }
  if (done === 'rejected') {
    return <span className="text-red-400 text-xs font-semibold">✗ Rejected</span>
  }

  if (mode === 'idle') {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setMode('approve')}
          className="text-xs px-2 py-1 rounded bg-green-700/40 text-green-300 hover:bg-green-700/70 transition-colors"
        >
          Approve
        </button>
        <button
          onClick={() => setMode('reject')}
          className="text-xs px-2 py-1 rounded bg-red-900/40 text-red-300 hover:bg-red-900/70 transition-colors"
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
        className="text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 focus:outline-none focus:border-slate-400 resize-none w-full"
      />
      <div className="flex gap-2">
        <button
          disabled={isPending || (mode === 'reject' && !comments.trim())}
          onClick={() => submit(mode)}
          className={`text-xs px-3 py-1 rounded font-semibold transition-colors disabled:opacity-40 ${
            mode === 'approve'
              ? 'bg-green-700 text-white hover:bg-green-600'
              : 'bg-red-700 text-white hover:bg-red-600'
          }`}
        >
          {isPending ? '...' : mode === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
        </button>
        <button
          onClick={() => { setMode('idle'); setComments('') }}
          className="text-xs px-2 py-1 rounded text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
