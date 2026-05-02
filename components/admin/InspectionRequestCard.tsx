'use client'

import { useTransition, useState } from 'react'
import { actionStartInspection, actionCancelInspectionRequest } from '@/app/(admin)/inspections/actions'
import type { InspectionRequest } from '@/lib/sheets/inspection-requests'

const STATUS_CHIP: Record<string, string> = {
  Pending:      'bg-amber-50 text-amber-700 border border-amber-200',
  'In Progress':'bg-sky-50 text-sky-700 border border-sky-200',
  Completed:    'bg-green-50 text-green-700 border border-green-200',
  Cancelled:    'bg-gray-100 text-gray-500 border border-gray-200',
}

interface Props {
  request: InspectionRequest
  isAdmin: boolean
}

export function InspectionRequestCard({ request: r, isAdmin }: Props) {
  const [isPending, startTransition] = useTransition()
  const [cancelMode, setCancelMode] = useState(false)

  function handleStart() {
    startTransition(async () => {
      await actionStartInspection(r.requestId)
    })
  }

  function handleCancel() {
    startTransition(async () => {
      await actionCancelInspectionRequest(r.requestId)
      setCancelMode(false)
    })
  }

  return (
    <div className="px-5 py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-slate-900 text-sm font-semibold">{r.areaName || r.unitId}</span>
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-slate-500 text-xs">{r.building.replace('PHASE ', 'P')}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_CHIP[r.status] ?? 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
              {r.status}
            </span>
          </div>
          {r.notes && <p className="text-slate-600 text-xs mb-1">{r.notes}</p>}
          <p className="text-slate-500 text-xs">
            Requested by {r.requestedBy} · {r.date}
            {r.startedAt && ` · Started ${new Date(r.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>

        <div className="flex-shrink-0 flex gap-1.5 items-center">
          {cancelMode ? (
            <>
              <button
                disabled={isPending}
                onClick={handleCancel}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold disabled:opacity-40 transition-colors"
              >
                {isPending ? '…' : 'Confirm cancel'}
              </button>
              <button onClick={() => setCancelMode(false)} className="text-xs text-slate-400 hover:text-slate-600">
                Keep
              </button>
            </>
          ) : (
            <>
              {isAdmin && r.status === 'Pending' && (
                <button
                  disabled={isPending}
                  onClick={handleStart}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold disabled:opacity-40 transition-colors"
                >
                  {isPending ? '…' : '▶ Start'}
                </button>
              )}
              {isAdmin && r.status === 'In Progress' && (
                <a
                  href={`/inspect?requestId=${r.requestId}`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-semibold transition-colors"
                >
                  Continue →
                </a>
              )}
              {r.status === 'Pending' && (
                <button
                  onClick={() => setCancelMode(true)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
