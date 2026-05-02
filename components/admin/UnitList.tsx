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
      <div className="flex gap-1 bg-slate-800 p-1 rounded-lg w-fit mb-5">
        {AREA_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`text-xs px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === type
                ? 'bg-slate-900 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {TAB_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-slate-400 text-sm">No records in this category.</p>
        )}
        {filtered.map(unit => {
          const unitSlug = encodeURIComponent(unit.unitId)
          return (
            <Link key={unit.unitId} href={`/buildings/${buildingSlug}/units/${unitSlug}`}>
              <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/70 transition-colors border border-slate-700 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-900/40 text-blue-400 font-bold text-xs px-3 py-1 rounded-md">
                    {unit.areaName}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{unit.unitId}</p>
                    <p className="text-slate-400 text-xs">
                      {unit.totalVisits} visits · Last: {unit.lastVisit || 'No record'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-white text-sm font-semibold">{unit.totalHours}h</p>
                    <p className="text-slate-400 text-xs">total hours</p>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">
                      ${unit.totalMaterialCost.toLocaleString('en-CA')}
                    </p>
                    <p className="text-slate-400 text-xs">materials</p>
                  </div>
                  <span className="text-blue-400 text-lg">›</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
