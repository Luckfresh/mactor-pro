'use client'

import { useState, useRef } from 'react'
import { actionSubmitInspection } from '@/app/(admin)/inspect/actions'
import { PhotoUpload } from '@/components/shared/PhotoUpload'
import type { InspectionRequest } from '@/lib/sheets/inspection-requests'
import type { UnitSummary } from '@/types'

type CategoryKey = 'commonAreas' | 'exterior' | 'windows' | 'walls' | 'bathroom' | 'kitchen' | 'floor' | 'electrical' | 'plumbing' | 'hvac' | 'safety'
type CategoryStatus = 'OK' | 'Minor' | 'Urgent'

interface CategoryState {
  status: CategoryStatus
  notes: string
  photoUrl?: string
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
  const visitType = 'Inspection'
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
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 shadow-md p-8 text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <p className="text-slate-900 text-xl font-bold">Inspection Submitted</p>
        <p className="text-slate-500 text-sm mt-2">
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
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
        <div>
          <p className="text-indigo-900 text-sm font-semibold">{request.areaName || request.unitId}</p>
          <p className="text-indigo-600 text-xs">{request.building.replace('PHASE ', 'Phase ')}</p>
        </div>
        {request.notes && (
          <p className="text-slate-600 text-xs max-w-[160px] text-right">"{request.notes}"</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="px-5 pt-4 pb-1 flex justify-between items-center">
          <span className="text-slate-400 text-xs">Step {step + 1} of {TOTAL_STEPS}</span>
          {step > 0 && step < TOTAL_STEPS - 1 && (
            <span className="text-xs text-slate-400">{CATEGORIES[step - 1]?.label}</span>
          )}
        </div>

        <div className="px-5 pb-5 pt-2">

          {/* ── Step 0: Visit Info ──────────────────────────────────── */}
          {step === 0 && (
            <div>
              <h2 className="text-slate-900 text-lg font-bold mb-1">Visit Info</h2>
              <p className="text-slate-500 text-sm mb-5">Basic details for this inspection</p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Tenant present</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setTenantPresent(true)}
                      className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                        tenantPresent
                          ? 'bg-green-50 border-2 border-green-500 text-green-700'
                          : 'bg-gray-50 border border-gray-200 text-slate-600 hover:border-gray-300'
                      }`}
                    >
                      ✓ Yes
                    </button>
                    <button onClick={() => setTenantPresent(false)}
                      className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                        !tenantPresent
                          ? 'bg-gray-100 border-2 border-gray-400 text-slate-700'
                          : 'bg-gray-50 border border-gray-200 text-slate-600 hover:border-gray-300'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {tenantPresent && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Tenant name</label>
                    <input
                      type="text"
                      value={tenantName}
                      onChange={e => setTenantName(e.target.value)}
                      placeholder="Full name"
                      className="w-full bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
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
                  <h2 className="text-slate-900 text-lg font-bold">{cat.label}</h2>
                </div>
                <p className="text-slate-500 text-sm mb-5">{cat.hint}</p>

                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">General condition</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button onClick={() => setCategory(cat.key, { status: 'OK' })}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                      state.status === 'OK'
                        ? 'bg-green-50 border-2 border-green-500 text-green-700'
                        : 'bg-gray-50 border-2 border-gray-200 text-slate-500 hover:border-gray-300'
                    }`}
                  >
                    ✓ OK
                  </button>
                  <button onClick={() => setCategory(cat.key, { status: 'Minor' })}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                      state.status === 'Minor'
                        ? 'bg-amber-50 border-2 border-amber-500 text-amber-700'
                        : 'bg-gray-50 border-2 border-gray-200 text-slate-500 hover:border-gray-300'
                    }`}
                  >
                    ⚠ Minor
                  </button>
                  <button onClick={() => setCategory(cat.key, { status: 'Urgent' })}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                      state.status === 'Urgent'
                        ? 'bg-red-50 border-2 border-red-500 text-red-700'
                        : 'bg-gray-50 border-2 border-gray-200 text-slate-500 hover:border-gray-300'
                    }`}
                  >
                    🔴 Urgent
                  </button>
                </div>

                {state.status !== 'OK' && (
                  <div className={`rounded-xl p-4 mb-4 border ${
                    state.status === 'Urgent' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                  }`}>
                    <label className={`text-xs font-semibold block mb-2 ${
                      state.status === 'Urgent' ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      Describe the issue
                    </label>
                    <textarea
                      value={state.notes}
                      onChange={e => setCategory(cat.key, { notes: e.target.value })}
                      placeholder="What did you observe? Be specific."
                      rows={3}
                      className="w-full bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none placeholder:text-slate-400"
                    />
                    <div className="mt-3">
                      <PhotoUpload
                        label={cat.key}
                        folderPath={`Inspections/${request.requestId}`}
                        value={categories[cat.key].photoUrl ?? ''}
                        onUploaded={url => setCategory(cat.key, { photoUrl: url })}
                        onClear={() => setCategory(cat.key, { photoUrl: '' })}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button onClick={() => setStep(s => s - 1)}
                    className="py-3 rounded-xl text-sm font-semibold border border-gray-200 text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    ← Back
                  </button>
                  <button onClick={() => setStep(s => s + 1)}
                    className="py-3 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
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
                <h2 className="text-slate-900 text-lg font-bold">Inspection Summary</h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  {request.areaName || request.unitId} · {request.building.replace('PHASE ', 'P')}
                  {tenantPresent && tenantName ? ` · ${tenantName}` : ''}
                </p>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                {CATEGORIES.map(c => {
                  const s = categories[c.key]
                  const border = s.status === 'Urgent' ? 'border-l-red-500' : s.status === 'Minor' ? 'border-l-amber-500' : 'border-l-green-500'
                  return (
                    <div key={c.key} className={`flex items-center justify-between bg-gray-50 border-l-4 rounded-lg px-3 py-2.5 ${border}`}>
                      <span className="text-slate-700 text-sm">{c.icon} {c.label}</span>
                      {s.status === 'OK' ? (
                        <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">✓ OK</span>
                      ) : s.status === 'Minor' ? (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">⚠ Minor</span>
                      ) : (
                        <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">🔴 Urgent</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {issueCount > 0 ? (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-5">
                  <p className="text-indigo-700 text-sm font-semibold">
                    {issueCount} issue{issueCount !== 1 ? 's' : ''} found
                    {urgentCount > 0 ? ` · ${urgentCount} urgent` : ''}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {issueCount} work order{issueCount !== 1 ? 's' : ''} will be created (Reported status).
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-5">
                  <p className="text-green-700 text-sm font-semibold">✓ No issues found</p>
                  <p className="text-slate-500 text-xs mt-1">Inspection record will be saved with hours logged.</p>
                </div>
              )}

              {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setStep(s => s - 1)}
                  className="py-3 rounded-xl text-sm font-semibold border border-gray-200 text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  ← Back
                </button>
                <button
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="py-3 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors"
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
