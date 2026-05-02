'use client'

import { useState, useTransition } from 'react'
import { actionApproveAndCreateWorkOrder, actionUpdateReportStatus } from '@/app/(admin)/tenants/actions'
import type { TenantReport } from '@/types'

interface Props {
  report: TenantReport
}

export function TenantReportActions({ report }: Props) {
  const [mode, setMode] = useState<'idle' | 'reject' | 'quote'>('idle')
  const [notes, setNotes] = useState('')
  const [amount, setAmount] = useState('')
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState<string | null>(null)

  if (report.status !== 'Pending') {
    const colors: Record<string, string> = {
      Approved: 'text-blue-400', Rejected: 'text-red-400',
      Quoted: 'text-purple-400', Resolved: 'text-green-400',
    }
    return <span className={`text-xs font-semibold ${colors[report.status] ?? 'text-slate-400'}`}>{report.status}</span>
  }

  if (done) return <span className="text-green-400 text-xs font-semibold">✓ {done}</span>

  if (mode === 'reject') {
    return (
      <div className="flex flex-col gap-2 min-w-[180px]">
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Reason (optional)" rows={2}
          className="text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 focus:outline-none resize-none" />
        <div className="flex gap-2">
          <button disabled={isPending} onClick={() => startTransition(async () => {
            await actionUpdateReportStatus(report.reportId, 'Rejected', notes)
            setDone('Rejected')
          })} className="text-xs px-3 py-1 rounded bg-red-700 text-white font-semibold disabled:opacity-40">
            {isPending ? '…' : 'Confirm'}
          </button>
          <button onClick={() => setMode('idle')} className="text-xs text-slate-400 hover:text-white">Cancel</button>
        </div>
      </div>
    )
  }

  if (mode === 'quote') {
    return (
      <div className="flex flex-col gap-2 min-w-[180px]">
        <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="$ Quote amount"
          className="text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 focus:outline-none w-full" />
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Note to tenant (optional)" rows={2}
          className="text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 focus:outline-none resize-none" />
        <div className="flex gap-2">
          <button disabled={isPending || !amount} onClick={() => startTransition(async () => {
            await actionUpdateReportStatus(report.reportId, 'Quoted', notes, parseFloat(amount))
            setDone('Quoted')
          })} className="text-xs px-3 py-1 rounded bg-purple-700 text-white font-semibold disabled:opacity-40">
            {isPending ? '…' : 'Send Quote'}
          </button>
          <button onClick={() => setMode('idle')} className="text-xs text-slate-400 hover:text-white">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      <button disabled={isPending} onClick={() => startTransition(async () => {
        await actionApproveAndCreateWorkOrder({
          reportId: report.reportId,
          building: report.building,
          unitId: report.unitId,
          areaName: report.unitId,
          description: report.description,
          urgency: report.urgency,
        })
        setDone('Approved')
      })} className="text-xs px-2 py-1 rounded bg-green-700/40 text-green-300 hover:bg-green-700/70 disabled:opacity-40 transition-colors">
        {isPending ? '…' : 'Approve'}
      </button>
      <button onClick={() => setMode('reject')}
        className="text-xs px-2 py-1 rounded bg-red-900/40 text-red-300 hover:bg-red-900/70 transition-colors">
        Reject
      </button>
      {report.wantsQuote && (
        <button onClick={() => setMode('quote')}
          className="text-xs px-2 py-1 rounded bg-purple-900/40 text-purple-300 hover:bg-purple-900/70 transition-colors">
          Quote
        </button>
      )}
    </div>
  )
}
