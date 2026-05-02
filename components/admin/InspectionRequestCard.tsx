'use client'

import { useTransition, useState } from 'react'
import { actionStartInspection, actionCancelInspectionRequest } from '@/app/(admin)/inspections/actions'
import type { InspectionRequest } from '@/lib/sheets/inspection-requests'

const STATUS_CHIP: Record<string, string> = {
  Pending: 'bg-amber-900/40 text-amber-300',
  'In Progress': 'bg-sky-900/40 text-sky-300',
  Completed: 'bg-green-900/40 text-green-300',
  Cancelled: 'bg-slate-700 text-slate-400',
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
    <div className="px-4 py-4 border-b border-slate-700/50 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-white text-sm font-medium">{r.areaName || r.unitId}</span>
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-slate-400 text-xs">{r.building.replace('PHASE ', 'P')}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CHIP[r.status] ?? ''}`}>
              {r.status}
            </span>
          </div>
          {r.notes && <p className="text-slate-400 text-xs mb-1">{r.notes}</p>}
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
                className="text-xs px-3 py-1.5 rounded-lg bg-red-700 text-white font-semibold disabled:opacity-40"
              >
                {isPending ? '…' : 'Confirm cancel'}
              </button>
              <button onClick={() => setCancelMode(false)} className="text-xs text-slate-400 hover:text-white">
                Keep
              </button>
            </>
          ) : (
            <>
              {isAdmin && r.status === 'Pending' && (
                <button
                  disabled={isPending}
                  onClick={handleStart}
                  className="text-xs px-3 py-1.5 rounded-lg bg-sky-700/60 text-sky-200 hover:bg-sky-700 disabled:opacity-40 font-semibold transition-colors"
                >
                  {isPending ? '…' : '▶ Start'}
                </button>
              )}
              {isAdmin && r.status === 'In Progress' && (
                <a
                  href={`/inspect?requestId=${r.requestId}`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-700/60 text-amber-200 hover:bg-amber-700 font-semibold transition-colors"
                >
                  Continue →
                </a>
              )}
              {r.status === 'Pending' && (
                <button
                  onClick={() => setCancelMode(true)}
                  className="text-xs text-slate-500 hover:text-slate-300"
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
