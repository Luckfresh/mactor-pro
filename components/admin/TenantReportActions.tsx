'use client'

import { useState, useTransition } from 'react'
import { actionApproveAndCreateWorkOrder, actionUpdateReportStatus } from '@/app/(admin)/tenants/actions'
import type { TenantReport } from '@/types'

interface Props {
  report: TenantReport
}

const STATUS_COLORS: Record<string, string> = {
  Approved: 'text-indigo-600',
  Rejected: 'text-red-600',
  Quoted:   'text-violet-600',
  Resolved: 'text-green-600',
}

export function TenantReportActions({ report }: Props) {
  const [mode, setMode] = useState<'idle' | 'reject' | 'quote'>('idle')
  const [notes, setNotes] = useState('')
  const [amount, setAmount] = useState('')
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState<string | null>(null)

  if (report.status !== 'Pending') {
    return <span className={`text-xs font-semibold ${STATUS_COLORS[report.status] ?? 'text-slate-400'}`}>{report.status}</span>
  }

  if (done) return <span className="text-green-600 text-xs font-semibold">✓ {done}</span>

  if (mode === 'reject') {
    return (
      <div className="flex flex-col gap-2 min-w-[180px]">
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Reason (optional)" rows={2}
          className="bg-white border border-gray-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full resize-none" />
        <div className="flex gap-2">
          <button disabled={isPending} onClick={() => startTransition(async () => {
            await actionUpdateReportStatus(report.reportId, 'Rejected', notes)
            setDone('Rejected')
          })} className="bg-red-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors">
            {isPending ? '…' : 'Confirm'}
          </button>
          <button onClick={() => setMode('idle')} className="text-slate-500 hover:text-slate-700 text-xs">Cancel</button>
        </div>
      </div>
    )
  }

  if (mode === 'quote') {
    return (
      <div className="flex flex-col gap-2 min-w-[180px]">
        <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="$ Quote amount"
          className="bg-white border border-gray-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full" />
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Note to tenant (optional)" rows={2}
          className="bg-white border border-gray-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full resize-none" />
        <div className="flex gap-2">
          <button disabled={isPending || !amount} onClick={() => startTransition(async () => {
            await actionUpdateReportStatus(report.reportId, 'Quoted', notes, parseFloat(amount))
            setDone('Quoted')
          })} className="bg-violet-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-violet-700 disabled:opacity-40 transition-colors">
            {isPending ? '…' : 'Send Quote'}
          </button>
          <button onClick={() => setMode('idle')} className="text-slate-500 hover:text-slate-700 text-xs">Cancel</button>
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
      })} className="bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
        {isPending ? '…' : 'Approve'}
      </button>
      <button onClick={() => setMode('reject')}
        className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
        Reject
      </button>
      {report.wantsQuote && (
        <button onClick={() => setMode('quote')}
          className="bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
          Quote
        </button>
      )}
    </div>
  )
}
