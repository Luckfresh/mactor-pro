'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { UnitSummary } from '@/types'

interface UnitListProps {
  units: UnitSummary[]
  building: string
}

const AREA_TYPES = ['Unit', 'Common Area', 'Exterior']

const TAB_LABELS: Record<string, string> = {
  'Unit': 'Units',
  'Common Area': 'Common Areas',
  'Exterior': 'Exterior',
}

export function UnitList({ units, building }: UnitListProps) {
  const [activeTab, setActiveTab] = useState('Unit')

  const filtered = units.filter(u => u.areaType === activeTab)
  const buildingSlug = encodeURIComponent(building)

  return (
    <div>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-5">
        {AREA_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`text-xs px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === type
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {TAB_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 && (
          <p className="text-slate-500 text-sm p-6">No records in this category.</p>
        )}
        {filtered.map((unit, i) => {
          const unitSlug = encodeURIComponent(unit.unitId)
          return (
            <Link
              key={unit.unitId}
              href={`/buildings/${buildingSlug}/units/${unitSlug}`}
              className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${
                i < filtered.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-md min-w-[36px] text-center">
                  {unit.areaName}
                </div>
                <div>
                  <p className="text-slate-900 text-sm font-medium">{unit.unitId}</p>
                  <p className="text-slate-400 text-xs">
                    {unit.totalVisits} visit{unit.totalVisits !== 1 ? 's' : ''} · Last: {unit.lastVisit || 'No record'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div>
                  <p className="text-slate-900 text-sm font-semibold">{unit.totalHours}h</p>
                  <p className="text-slate-400 text-xs">total hours</p>
                </div>
                <div>
                  <p className="text-slate-900 text-sm font-semibold">
                    ${unit.totalMaterialCost.toLocaleString('en-CA')}
                  </p>
                  <p className="text-slate-400 text-xs">materials</p>
                </div>
                <span className="text-slate-400 text-sm">›</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
