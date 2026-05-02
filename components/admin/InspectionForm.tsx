'use client'

import { useState, useEffect, useCallback } from 'react'
import { actionSubmitInspection, type InspectionPayload } from '@/app/(admin)/inspect/actions'

const BUILDINGS = [
  'PHASE I 72 Isabella',
  'PHASE II Church',
  'PHASE III Wellesley',
]
const AREA_TYPES = ['Unit', 'Common Area', 'Exterior', 'Roof', 'Parking', 'Mechanical']
const DEFECT_TYPES = ['Plumbing', 'Electrical', 'HVAC', 'Structural', 'Cosmetic', 'Safety', 'Pest', 'Other']
const URGENCIES = ['Low', 'Medium', 'High', 'Emergency']

const URGENCY_COLOR: Record<string, string> = {
  Low: 'bg-slate-700 text-slate-300 border-slate-600',
  Medium: 'bg-blue-900/40 text-blue-300 border-blue-700',
  High: 'bg-amber-900/40 text-amber-300 border-amber-700',
  Emergency: 'bg-red-900/40 text-red-300 border-red-700',
}

const QUEUE_KEY = 'inspection_queue'

interface QueuedInspection extends InspectionPayload {
  queuedAt: string
}

function loadQueue(): QueuedInspection[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') } catch { return [] }
}

function saveQueue(q: QueuedInspection[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
}

const blank: InspectionPayload = {
  building: '', unitId: '', areaType: 'Unit', areaName: '',
  defectType: '', urgency: 'Medium', description: '', estimatedHours: 1, notes: '',
}

export function InspectionForm() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<InspectionPayload>(blank)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [syncingQueue, setSyncingQueue] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    setQueueCount(loadQueue().length)
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const syncQueue = useCallback(async () => {
    const queue = loadQueue()
    if (queue.length === 0) return
    setSyncingQueue(true)
    const remaining: QueuedInspection[] = []
    for (const item of queue) {
      const { queuedAt: _, ...payload } = item
      const res = await actionSubmitInspection(payload)
      if (!res.ok) remaining.push(item)
    }
    saveQueue(remaining)
    setQueueCount(remaining.length)
    setSyncingQueue(false)
  }, [])

  useEffect(() => {
    if (isOnline && queueCount > 0) syncQueue()
  }, [isOnline, queueCount, syncQueue])

  function set(key: keyof InspectionPayload, value: string | number) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    if (!isOnline) {
      const queue = loadQueue()
      queue.push({ ...form, queuedAt: new Date().toISOString() })
      saveQueue(queue)
      setQueueCount(queue.length)
      setSubmitted(true)
      setSubmitting(false)
      return
    }
    const res = await actionSubmitInspection(form)
    setSubmitting(false)
    if (res.ok) {
      setSubmitted(true)
    } else {
      setError(res.error ?? 'Unknown error')
    }
  }

  if (submitted) {
    return (
      <div className="bg-slate-800 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">{isOnline ? '✓' : '📶'}</div>
        <p className="text-white text-lg font-semibold">
          {isOnline ? 'Inspection submitted' : 'Saved for sync'}
        </p>
        <p className="text-slate-400 text-sm mt-1">
          {isOnline
            ? 'Work order created — awaiting manager approval.'
            : 'Will sync automatically when back online.'}
        </p>
        {queueCount > 0 && (
          <p className="text-amber-400 text-xs mt-2">{queueCount} inspection{queueCount > 1 ? 's' : ''} pending sync</p>
        )}
        <button
          onClick={() => { setForm(blank); setStep(1); setSubmitted(false) }}
          className="mt-6 bg-amber-500 text-slate-900 font-bold text-sm px-6 py-2 rounded-lg hover:bg-amber-400 transition-colors"
        >
          New Inspection
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-900/40 border border-amber-700 rounded-xl px-4 py-2 mb-4 text-amber-300 text-sm flex items-center gap-2">
          <span>📶</span>
          <span>Offline — submissions will sync when back online.</span>
        </div>
      )}
      {queueCount > 0 && isOnline && !syncingQueue && (
        <div className="bg-sky-900/40 border border-sky-700 rounded-xl px-4 py-2 mb-4 text-sky-300 text-sm flex items-center justify-between">
          <span>{queueCount} offline inspection{queueCount > 1 ? 's' : ''} pending sync</span>
          <button onClick={syncQueue} className="text-xs underline">Sync now</button>
        </div>
      )}
      {syncingQueue && (
        <div className="bg-sky-900/40 border border-sky-700 rounded-xl px-4 py-2 mb-4 text-sky-300 text-sm">
          Syncing offline inspections…
        </div>
      )}

      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? 'bg-amber-500' : 'bg-slate-700'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="bg-slate-800 rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="text-white font-semibold text-lg">Location</h2>

          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wide block mb-2">Building *</label>
            <div className="flex flex-col gap-2">
              {BUILDINGS.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => set('building', b)}
                  className={`text-left text-sm px-4 py-3 rounded-xl border transition-colors ${
                    form.building === b
                      ? 'bg-amber-500/20 border-amber-500 text-white font-medium'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-400'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1">Unit / Area ID</label>
              <input
                type="text"
                value={form.unitId}
                onChange={e => set('unitId', e.target.value)}
                placeholder="e.g. 301, Lobby"
                className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-slate-600 focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1">Area Name</label>
              <input
                type="text"
                value={form.areaName}
                onChange={e => set('areaName', e.target.value)}
                placeholder="e.g. Master Bath"
                className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-slate-600 focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wide block mb-2">Area Type</label>
            <div className="flex flex-wrap gap-2">
              {AREA_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('areaType', t)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.areaType === t
                      ? 'bg-sky-700 border-sky-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!form.building}
            onClick={() => setStep(2)}
            className="bg-amber-500 text-slate-900 font-bold py-3 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-40 mt-2"
          >
            Next →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-slate-800 rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white text-sm">←</button>
            <h2 className="text-white font-semibold text-lg">Defect Details</h2>
          </div>

          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wide block mb-2">Defect Type *</label>
            <div className="flex flex-wrap gap-2">
              {DEFECT_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('defectType', t)}
                  className={`text-sm px-3 py-2 rounded-xl border transition-colors ${
                    form.defectType === t
                      ? 'bg-sky-700 border-sky-500 text-white font-medium'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wide block mb-2">Urgency *</label>
            <div className="grid grid-cols-4 gap-2">
              {URGENCIES.map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => set('urgency', u)}
                  className={`text-sm py-2.5 rounded-xl border font-medium transition-colors ${
                    form.urgency === u
                      ? URGENCY_COLOR[u]
                      : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-400'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="What's the problem?"
              rows={3}
              className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-slate-600 focus:outline-none focus:border-sky-500 placeholder:text-slate-600 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1">Est. Hours</label>
              <input
                type="number" min="0.5" step="0.5"
                value={form.estimatedHours}
                onChange={e => set('estimatedHours', parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Optional"
                className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-slate-600 focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            disabled={submitting || !form.defectType || !form.description}
            onClick={handleSubmit}
            className={`font-bold py-3.5 rounded-xl transition-colors disabled:opacity-40 ${
              !isOnline
                ? 'bg-amber-600 text-white hover:bg-amber-500'
                : 'bg-amber-500 text-slate-900 hover:bg-amber-400'
            }`}
          >
            {submitting ? 'Submitting…' : !isOnline ? 'Save Offline' : 'Submit Inspection'}
          </button>
        </div>
      )}
    </div>
  )
}
