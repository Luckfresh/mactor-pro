'use client'

import { useState, useTransition } from 'react'
import { actionStartDirectInspection } from '@/app/(admin)/inspections/actions'
import type { UnitSummary } from '@/types'

interface Props {
  unitsByBuilding: Record<string, UnitSummary[]>
}

export function StartInspectionForm({ unitsByBuilding }: Props) {
  const [building, setBuilding] = useState('')
  const [unitId, setUnitId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const buildings = Object.keys(unitsByBuilding).sort()
  const units = unitsByBuilding[building] ?? []
  const selectedUnit = units.find(u => u.unitId === unitId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!building || !unitId) return
    setError('')
    startTransition(async () => {
      try {
        await actionStartDirectInspection({
          building,
          unitId,
          areaName: selectedUnit?.areaName ?? unitId,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error starting inspection')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Building</label>
        <select
          value={building}
          onChange={e => { setBuilding(e.target.value); setUnitId('') }}
          required
          className="w-full bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select building...</option>
          {buildings.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Unit / Area</label>
        <select
          value={unitId}
          onChange={e => setUnitId(e.target.value)}
          disabled={!building}
          required
          className="w-full bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-40"
        >
          <option value="">Select unit...</option>
          {units.map(u => (
            <option key={u.unitId} value={u.unitId}>
              {u.areaName || u.unitId} — {u.areaType}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !building || !unitId}
        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
      >
        {isPending ? 'Starting…' : '▶ Start Inspection'}
      </button>
    </form>
  )
}
