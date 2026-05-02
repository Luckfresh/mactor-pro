'use client'

import { useState, useEffect, useRef } from 'react'
import { actionSubmitInspection } from '@/app/(admin)/inspect/actions'
import type { InspectionRequest } from '@/lib/sheets/inspection-requests'
import type { UnitSummary } from '@/types'

type CategoryKey = 'commonAreas' | 'exterior' | 'windows' | 'walls' | 'bathroom' | 'kitchen' | 'floor' | 'electrical' | 'plumbing' | 'hvac' | 'safety'
type CategoryStatus = 'OK' | 'Minor' | 'Urgent'

interface CategoryState {
  status: CategoryStatus
  notes: string
}

const CATEGORIES: { key: CategoryKey; label: string; icon: string; hint: string }[] = [
  { key: 'commonAreas', label: 'Common Areas', icon: '🏢', hint: 'Lobby, hallways, stairs, laundry room' },
  { key: 'exterior',    label: 'Exterior',      icon: '🏗️', hint: 'Facade, entrance, parking area' },
  { key: 'windows',     label: 'Windows',       icon: '🪟', hint: 'Glass, frames, sealing, latches' },
  { key: 'walls',       label: 'Walls',         icon: '🧱', hint: 'Paint, cracks, moisture, damage' },
  { key: 'bathroom',    label: 'Bathroom',      icon: '🚿', hint: 'Fixtures, faucets, caulking, ventilation' },
  { key: 'kitchen',     label: 'Kitchen',       icon: '🍳', hint: 'Cabinets, sink, faucets, silicone' },
  { key: 'floor',       label: 'Floor',         icon: '⬛', hint: 'Tiles, hardwood, carpet, leveling' },
  { key: 'electrical',  label: 'Electrical',    icon: '⚡', hint: 'Outlets, switches, lights, panel' },
  { key: 'plumbing',    label: 'Plumbing',      icon: '🔧', hint: 'Leaks, pressure, drainage, water heater' },
  { key: 'hvac',        label: 'HVAC',          icon: '❄️', hint: 'Air conditioning, heating, ventilation' },
  { key: 'safety',      label: 'Safety',        icon: '🔒', hint: 'Smoke detectors, locks, fire extinguishers' },
]

const TOTAL_STEPS = 13

const blankCategories = (): Record<CategoryKey, CategoryState> =>
  Object.fromEntries(CATEGORIES.map(c => [c.key, { status: 'OK' as CategoryStatus, notes: '' }])) as Record<CategoryKey, CategoryState>

interface Props {
  request: InspectionRequest
  unit: UnitSummary | null
}

export function InspectionForm({ request, unit }: Props) {
  const [step, setStep] = useState(0)
  const [visitType, setVisitType] = useState<'Inspection' | 'Repair'>('Inspection')
  const [tenantPresent, setTenantPresent] = useState(false)
  const [tenantName, setTenantName] = useState('')
  const [categories, setCategories] = useState<Record<CategoryKey, CategoryState>>(blankCategories)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const mountTimeRef = useRef(new Date().toISOString())

  // Use server-recorded startedAt if available, else use component mount time
  const startedAt = request.startedAt || mountTimeRef.current

  function setCategory(key: CategoryKey, patch: Partial<CategoryState>) {
    setCategories(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')

    const res = await actionSubmitInspection({
      requestId: request.requestId,
      building: request.building,
      unitId: request.unitId,
      areaName: request.areaName || unit?.areaName || request.unitId,
      areaType: unit?.areaType ?? '',
      visitType,
      tenantPresent,
      tenantName,
      startedAt,
      categories: Object.fromEntries(CATEGORIES.map(c => [c.key, categories[c.key]])),
    })

    setSubmitting(false)
    if (res.ok) {
      setSubmitted(true)
    } else {
      setError(res.error ?? 'Error submitting inspection')
    }
  }

  const progress = Math.round(((step + 1) / TOTAL_STEPS) * 100)
  const issueCount = CATEGORIES.filter(c => categories[c.key].status !== 'OK').length
  const urgentCount = CATEGORIES.filter(c => categories[c.key].status === 'Urgent').length

  // ── Submitted ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto bg-slate-800 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">✓</div>
        <p className="text-white text-xl font-bold">Inspection Submitted</p>
        <p className="text-slate-400 text-sm mt-2">
          {issueCount > 0
            ? `${issueCount} issue${issueCount !== 1 ? 's' : ''} logged${urgentCount > 0 ? ` · ${urgentCount} urgent` : ''} · work orders created`
            : 'No issues found — record saved'}
        </p>
        <a
          href="/inspections"
          className="mt-6 inline-block bg-amber-500 text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-amber-400 transition-colors"
        >
          Back to Inspections
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Unit info banner */}
      <div className="bg-slate-700/50 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-semibold">{request.areaName || request.unitId}</p>
          <p className="text-slate-400 text-xs">{request.building.replace('PHASE ', 'Phase ')}</p>
        </div>
        {request.notes && (
          <p className="text-slate-400 text-xs max-w-[160px] text-right">"{request.notes}"</p>
        )}
      </div>

      <div className="bg-slate-800 rounded-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-700">
          <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="px-5 pt-4 pb-1 flex justify-between items-center">
          <span className="text-slate-500 text-xs">Step {step + 1} of {TOTAL_STEPS}</span>
          {step > 0 && step < TOTAL_STEPS - 1 && (
            <span className="text-xs text-slate-500">{CATEGORIES[step - 1]?.label}</span>
          )}
        </div>

        <div className="px-5 pb-5 pt-2">

          {/* ── Step 0: Visit Info ──────────────────────────────────── */}
          {step === 0 && (
            <div>
              <h2 className="text-white text-lg font-bold mb-1">Visit Info</h2>
              <p className="text-slate-400 text-sm mb-5">Basic details for this inspection</p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1.5">Visit type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Inspection', 'Repair'] as const).map(t => (
                      <button key={t} onClick={() => setVisitType(t)}
                        className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                          visitType === t
                            ? 'bg-sky-700 border-sky-500 text-white'
                            : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1.5">Tenant present</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setTenantPresent(true)}
                      className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                        tenantPresent
                          ? 'bg-green-800 border-green-500 text-green-200'
                          : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      ✓ Yes
                    </button>
                    <button onClick={() => setTenantPresent(false)}
                      className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                        !tenantPresent
                          ? 'bg-slate-600 border-slate-400 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {tenantPresent && (
                  <div>
                    <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1.5">Tenant name</label>
                    <input
                      type="text"
                      value={tenantName}
                      onChange={e => setTenantName(e.target.value)}
                      placeholder="Full name"
                      className="w-full bg-slate-700 text-white rounded-lg px-3 py-2.5 text-sm border border-slate-600 focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full mt-6 bg-sky-600 text-white font-bold py-3 rounded-xl hover:bg-sky-500 transition-colors"
              >
                Start Inspection →
              </button>
            </div>
          )}

          {/* ── Steps 1-11: Category steps ───────────────────────────── */}
          {step >= 1 && step <= 11 && (() => {
            const cat = CATEGORIES[step - 1]
            const state = categories[cat.key]
            return (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{cat.icon}</span>
                  <h2 className="text-white text-lg font-bold">{cat.label}</h2>
                </div>
                <p className="text-slate-400 text-sm mb-5">{cat.hint}</p>

                <label className="text-slate-400 text-xs uppercase tracking-wide block mb-2">General condition</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button onClick={() => setCategory(cat.key, { status: 'OK' })}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                      state.status === 'OK'
                        ? 'bg-green-800/60 border-green-500 text-green-200'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-green-700'
                    }`}
                  >
                    ✓ OK
                  </button>
                  <button onClick={() => setCategory(cat.key, { status: 'Minor' })}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                      state.status === 'Minor'
                        ? 'bg-amber-800/60 border-amber-500 text-amber-200'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-amber-700'
                    }`}
                  >
                    ⚠ Minor
                  </button>
                  <button onClick={() => setCategory(cat.key, { status: 'Urgent' })}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                      state.status === 'Urgent'
                        ? 'bg-red-800/60 border-red-500 text-red-200'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-red-700'
                    }`}
                  >
                    🔴 Urgent
                  </button>
                </div>

                {state.status !== 'OK' && (
                  <div className={`rounded-xl p-4 mb-4 border ${
                    state.status === 'Urgent' ? 'bg-red-900/20 border-red-700' : 'bg-amber-900/20 border-amber-700'
                  }`}>
                    <label className={`text-xs font-semibold block mb-2 ${
                      state.status === 'Urgent' ? 'text-red-300' : 'text-amber-300'
                    }`}>
                      Describe the issue
                    </label>
                    <textarea
                      value={state.notes}
                      onChange={e => setCategory(cat.key, { notes: e.target.value })}
                      placeholder="What did you observe? Be specific."
                      rows={3}
                      className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none resize-none placeholder:text-slate-600"
                    />
                    <label className="mt-3 flex flex-col items-center justify-center h-12 rounded-lg border-2 border-dashed border-slate-600 text-slate-500 hover:border-amber-500 hover:text-amber-400 cursor-pointer transition-colors">
                      <input type="file" accept="image/*" capture="environment" className="hidden" />
                      <span className="text-xs">📷 Add photo</span>
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button onClick={() => setStep(s => s - 1)}
                    className="py-3 rounded-xl text-sm font-semibold border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white transition-colors"
                  >
                    ← Back
                  </button>
                  <button onClick={() => setStep(s => s + 1)}
                    className="py-3 rounded-xl text-sm font-bold bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )
          })()}

          {/* ── Step 12: Summary ─────────────────────────────────────── */}
          {step === TOTAL_STEPS - 1 && (
            <div>
              <div className="text-center mb-5">
                <div className="text-3xl mb-2">📋</div>
                <h2 className="text-white text-lg font-bold">Inspection Summary</h2>
                <p className="text-slate-400 text-sm mt-0.5">
                  {request.areaName || request.unitId} · {request.building.replace('PHASE ', 'P')}
                  {tenantPresent && tenantName ? ` · ${tenantName}` : ''}
                </p>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                {CATEGORIES.map(c => {
                  const s = categories[c.key]
                  const border = s.status === 'Urgent' ? 'border-l-red-500' : s.status === 'Minor' ? 'border-l-amber-500' : 'border-l-green-500'
                  return (
                    <div key={c.key} className={`flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2.5 border-l-4 ${border}`}>
                      <span className="text-slate-300 text-sm">{c.icon} {c.label}</span>
                      {s.status === 'OK' ? (
                        <span className="text-xs bg-green-900/40 text-green-300 px-2 py-0.5 rounded-full font-semibold">✓ OK</span>
                      ) : s.status === 'Minor' ? (
                        <span className="text-xs bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full font-semibold">⚠ Minor</span>
                      ) : (
                        <span className="text-xs bg-red-900/40 text-red-300 px-2 py-0.5 rounded-full font-semibold">🔴 Urgent</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {issueCount > 0 ? (
                <div className="bg-sky-900/30 border border-sky-800 rounded-xl px-4 py-3 mb-5">
                  <p className="text-sky-300 text-sm font-semibold">
                    {issueCount} issue{issueCount !== 1 ? 's' : ''} found
                    {urgentCount > 0 ? ` · ${urgentCount} urgent` : ''}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {issueCount} work order{issueCount !== 1 ? 's' : ''} will be created (Reported status).
                  </p>
                </div>
              ) : (
                <div className="bg-green-900/20 border border-green-800 rounded-xl px-4 py-3 mb-5">
                  <p className="text-green-300 text-sm font-semibold">✓ No issues found</p>
                  <p className="text-slate-400 text-xs mt-1">Inspection record will be saved with hours logged.</p>
                </div>
              )}

              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setStep(s => s - 1)}
                  className="py-3 rounded-xl text-sm font-semibold border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <button
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="py-3 rounded-xl text-sm font-bold bg-green-700 text-white hover:bg-green-600 disabled:opacity-40 transition-colors"
                >
                  {submitting ? 'Submitting…' : '✓ Submit'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
