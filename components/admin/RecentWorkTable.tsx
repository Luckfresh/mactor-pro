'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { formatDate } from '@/lib/hours'
import type { Visit } from '@/types'

interface RecentWorkTableProps {
  visits: Visit[]
}

const BUILDING_SHORT: Record<string, string> = {
  'PHASE I 72 Isabella': 'Ph I',
  'PHASE II Church': 'Ph II',
  'PHASE III Wellesley': 'Ph III',
}

const BUILDING_CHIP: Record<string, string> = {
  'PHASE I 72 Isabella': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'PHASE II Church': 'bg-sky-50 text-sky-700 border-sky-200',
  'PHASE III Wellesley': 'bg-violet-50 text-violet-700 border-violet-200',
}

export function RecentWorkTable({ visits }: RecentWorkTableProps) {
  const [building, setBuilding] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [technician, setTechnician] = useState('')

  const buildings = useMemo(() => [...new Set(visits.map(v => v.building))].sort(), [visits])
  const technicians = useMemo(() => [...new Set(visits.map(v => v.technician).filter(Boolean))].sort(), [visits])

  const filtered = useMemo(() => {
    return visits.filter(v => {
      if (building && v.building !== building) return false
      if (dateFrom && v.date < dateFrom) return false
      if (dateTo && v.date > dateTo) return false
      if (technician && v.technician !== technician) return false
      return true
    })
  }, [visits, building, dateFrom, dateTo, technician])

  const isFiltered = building || dateFrom || dateTo || technician

  function reset() {
    setBuilding('')
    setDateFrom('')
    setDateTo('')
    setTechnician('')
  }

  if (visits.length === 0) {
    return <p className="text-slate-500 text-sm">No recent work.</p>
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 mb-3 flex flex-wrap items-center gap-3">
        <select
          value={building}
          onChange={e => setBuilding(e.target.value)}
          className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All buildings</option>
          {buildings.map(b => (
            <option key={b} value={b}>{BUILDING_SHORT[b] ?? b}</option>
          ))}
        </select>

        <select
          value={technician}
          onChange={e => setTechnician(e.target.value)}
          className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All technicians</option>
          {technicians.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-slate-400 text-xs">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {isFiltered && (
          <button
            onClick={reset}
            className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 ml-auto"
          >
            Clear filters
          </button>
        )}

        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[90px_76px_1fr_130px_120px_64px_88px_88px] gap-2 px-5 py-2.5 bg-gray-50 border-b border-gray-200">
          {['Date', 'Building', 'Unit / Area', 'Work Type', 'Technician', 'Hours', 'Cost', 'Status'].map(h => (
            <span key={h} className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-slate-500 text-sm">No results match the current filters.</p>
          </div>
        ) : (
          filtered.slice(0, 50).map((v, i) => {
            const buildingSlug = encodeURIComponent(v.building)
            const unitSlug = encodeURIComponent(v.unitId)
            const tag = BUILDING_SHORT[v.building] ?? v.building
            const chipColor = BUILDING_CHIP[v.building] ?? 'bg-slate-100 text-slate-600 border-slate-200'

            return (
              <Link
                key={`${v.date}-${v.building}-${v.unitId}-${i}`}
                href={`/buildings/${buildingSlug}/units/${unitSlug}`}
                className="grid grid-cols-[90px_76px_1fr_130px_120px_64px_88px_88px] gap-2 px-5 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <span className="text-slate-500 text-xs self-center">{formatDate(v.date)}</span>
                <span className="self-center">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${chipColor}`}>{tag}</span>
                </span>
                <span className="text-slate-900 text-sm font-medium truncate self-center">{v.areaName || v.unitId}</span>
                <span className="text-slate-600 text-sm truncate self-center">{v.visitType}</span>
                <span className="text-slate-500 text-xs truncate self-center">{v.technician || '—'}</span>
                <span className="text-slate-900 text-sm font-medium self-center">{v.duration.toFixed(1)}h</span>
                <span className="text-slate-600 text-sm self-center">
                  {v.materialCost > 0
                    ? `$${v.materialCost.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '—'}
                </span>
                <span className="self-center">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    v.status === 'Completed'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : v.status === 'Pending'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {v.status}
                  </span>
                </span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
