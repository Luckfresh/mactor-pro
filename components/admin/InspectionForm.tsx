'use client'

import { useState, useEffect, useCallback } from 'react'
import { actionSubmitInspection, type InspectionPayload } from '@/app/(admin)/inspect/actions'
import type { UnitSummary } from '@/types'

const BUILDINGS = [
  'PHASE I 72 Isabella',
  'PHASE II Church',
  'PHASE III Wellesley',
]

const DEFECT_TYPES = ['Plumbing', 'Electrical', 'HVAC', 'Structural', 'Cosmetic', 'Safety', 'Pest', 'Other']

const URGENCY = [
  { key: 'Low',       label: 'OK',        color: 'bg-slate-700 border-slate-600 text-slate-300',    active: 'bg-green-800 border-green-500 text-green-200' },
  { key: 'Medium',    label: 'Minor',     color: 'bg-slate-700 border-slate-600 text-slate-300',    active: 'bg-amber-800 border-amber-500 text-amber-200' },
  { key: 'High',      label: 'Major',     color: 'bg-slate-700 border-slate-600 text-slate-300',    active: 'bg-orange-800 border-orange-500 text-orange-200' },
  { key: 'Emergency', label: 'Emergency', color: 'bg-slate-700 border-slate-600 text-slate-300',    active: 'bg-red-800 border-red-500 text-red-200' },
]

const URGENCY_BADGE: Record<string, string> = {
  Low: 'bg-green-900/40 text-green-300 border-green-700',
  Medium: 'bg-amber-900/40 text-amber-300 border-amber-700',
  High: 'bg-orange-900/40 text-orange-300 border-orange-700',
  Emergency: 'bg-red-900/40 text-red-300 border-red-700',
}
const URGENCY_LABEL: Record<string, string> = {
  Low: 'OK', Medium: 'Minor', High: 'Major', Emergency: 'Emergency',
}

interface Issue {
  defectType: string
  urgency: string
  description: string
  estimatedHours: number
  notes: string
}

interface AreaEntry {
  unit: UnitSummary
  issues: Issue[]
}

const QUEUE_KEY = 'inspection_queue'
interface Queued extends InspectionPayload { queuedAt: string }
function loadQueue(): Queued[] { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') } catch { return [] } }
function saveQueue(q: Queued[]) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)) }

const blankIssue = (): Issue => ({ defectType: '', urgency: 'Medium', description: '', estimatedHours: 1, notes: '' })

interface Props {
  unitsByBuilding: Record<string, UnitSummary[]>
}

type Screen = 'building' | 'areas' | 'area-detail'

export function InspectionForm({ unitsByBuilding }: Props) {
  const [screen, setScreen] = useState<Screen>('building')
  const [building, setBuilding] = useState('')
  const [areas, setAreas] = useState<AreaEntry[]>([])
  const [activeArea, setActiveArea] = useState<AreaEntry | null>(null)
  const [newIssue, setNewIssue] = useState<Issue | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

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
    if (!queue.length) return
    setSyncing(true)
    const remaining: Queued[] = []
    for (const { queuedAt: _, ...p } of queue) {
      const res = await actionSubmitInspection(p)
      if (!res.ok) remaining.push({ ...p, queuedAt: _ })
    }
    saveQueue(remaining)
    setQueueCount(remaining.length)
    setSyncing(false)
  }, [])

  useEffect(() => { if (isOnline && queueCount > 0) syncQueue() }, [isOnline, queueCount, syncQueue])

  const units = unitsByBuilding[building] ?? []
  const totalIssues = areas.reduce((s, a) => s + a.issues.length, 0)

  function selectBuilding(b: string) {
    setBuilding(b)
    setAreas([])
    setScreen('areas')
  }

  function openArea(unit: UnitSummary) {
    const existing = areas.find(a => a.unit.unitId === unit.unitId && a.unit.areaName === unit.areaName)
    if (existing) {
      setActiveArea(existing)
    } else {
      const entry: AreaEntry = { unit, issues: [] }
      setAreas(prev => [...prev.filter(a => !(a.unit.unitId === unit.unitId && a.unit.areaName === unit.areaName)), entry])
      setActiveArea(entry)
    }
    setNewIssue(null)
    setEditingIdx(null)
    setScreen('area-detail')
  }

  function saveIssue(issue: Issue) {
    if (!activeArea) return
    let updated: AreaEntry
    if (editingIdx !== null) {
      const issues = [...activeArea.issues]
      issues[editingIdx] = issue
      updated = { ...activeArea, issues }
    } else {
      updated = { ...activeArea, issues: [...activeArea.issues, issue] }
    }
    setAreas(prev => prev.map(a =>
      a.unit.unitId === activeArea.unit.unitId && a.unit.areaName === activeArea.unit.areaName ? updated : a
    ))
    setActiveArea(updated)
    setNewIssue(null)
    setEditingIdx(null)
  }

  function removeIssue(idx: number) {
    if (!activeArea) return
    const issues = activeArea.issues.filter((_, i) => i !== idx)
    const updated = { ...activeArea, issues }
    setAreas(prev => prev.map(a =>
      a.unit.unitId === activeArea.unit.unitId && a.unit.areaName === activeArea.unit.areaName ? updated : a
    ))
    setActiveArea(updated)
  }

  async function handleSubmitAll() {
    const toSubmit = areas.flatMap(a =>
      a.issues.map(issue => ({
        building,
        unitId: a.unit.unitId,
        areaType: a.unit.areaType,
        areaName: a.unit.areaName,
        defectType: issue.defectType,
        urgency: issue.urgency,
        description: issue.description,
        estimatedHours: issue.estimatedHours,
        notes: issue.notes,
      } satisfies InspectionPayload))
    )
    if (!toSubmit.length) return
    setSubmitting(true)
    setError('')

    if (!isOnline) {
      const queue = loadQueue()
      toSubmit.forEach(p => queue.push({ ...p, queuedAt: new Date().toISOString() }))
      saveQueue(queue)
      setQueueCount(queue.length)
      setSubmitted(true)
      setSubmitting(false)
      return
    }

    const results = await Promise.all(toSubmit.map(p => actionSubmitInspection(p)))
    const failed = results.filter(r => !r.ok)
    setSubmitting(false)
    if (failed.length) {
      setError(`${failed.length} issue(s) failed to submit. ${failed[0].error ?? ''}`)
    } else {
      setSubmitted(true)
    }
  }

  // ── Submitted ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto bg-slate-800 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">{isOnline ? '✓' : '📶'}</div>
        <p className="text-white text-xl font-bold">
          {isOnline ? `${totalIssues} issue${totalIssues !== 1 ? 's' : ''} submitted` : 'Saved offline'}
        </p>
        <p className="text-slate-400 text-sm mt-2">
          {isOnline
            ? 'Work orders created — awaiting Eddie\'s approval.'
            : 'Will sync automatically when back online.'}
        </p>
        {queueCount > 0 && (
          <p className="text-amber-400 text-xs mt-2">{queueCount} pending sync</p>
        )}
        <button
          onClick={() => { setScreen('building'); setBuilding(''); setAreas([]); setSubmitted(false) }}
          className="mt-6 bg-amber-500 text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-amber-400 transition-colors"
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
          <span>📶</span><span>Offline — will sync when back online.</span>
        </div>
      )}
      {queueCount > 0 && isOnline && !syncing && (
        <div className="bg-sky-900/40 border border-sky-700 rounded-xl px-4 py-2 mb-4 text-sky-300 text-sm flex items-center justify-between">
          <span>{queueCount} offline issue{queueCount > 1 ? 's' : ''} pending sync</span>
          <button onClick={syncQueue} className="text-xs underline">Sync now</button>
        </div>
      )}

      {/* ── Screen: Building select ── */}
      {screen === 'building' && (
        <div className="bg-slate-800 rounded-2xl p-6 flex flex-col gap-3">
          <h2 className="text-white font-semibold text-lg mb-2">Select Building</h2>
          {BUILDINGS.map(b => (
            <button
              key={b}
              onClick={() => selectBuilding(b)}
              className="text-left text-sm px-4 py-4 rounded-xl border border-slate-600 bg-slate-700 text-slate-200 hover:border-amber-500 hover:text-white hover:bg-slate-600 transition-colors font-medium"
            >
              {b}
            </button>
          ))}
        </div>
      )}

      {/* ── Screen: Area list ── */}
      {screen === 'areas' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <button onClick={() => setScreen('building')} className="text-slate-400 text-sm hover:text-white">← {building.replace('PHASE ', 'P')}</button>
              <p className="text-slate-500 text-xs mt-0.5">Select an area to inspect</p>
            </div>
            {totalIssues > 0 && (
              <button
                disabled={submitting}
                onClick={handleSubmitAll}
                className="bg-amber-500 text-slate-900 font-bold text-sm px-4 py-2 rounded-xl hover:bg-amber-400 disabled:opacity-40 transition-colors"
              >
                {submitting ? '…' : `Submit ${totalIssues} issue${totalIssues !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          <div className="flex flex-col gap-2">
            {units.map(unit => {
              const entry = areas.find(a => a.unit.unitId === unit.unitId && a.unit.areaName === unit.areaName)
              const count = entry?.issues.length ?? 0
              return (
                <button
                  key={`${unit.unitId}-${unit.areaName}`}
                  onClick={() => openArea(unit)}
                  className={`flex items-center justify-between text-left px-4 py-3.5 rounded-xl border transition-colors ${
                    count > 0
                      ? 'border-amber-600 bg-amber-900/20 text-white'
                      : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-400 hover:text-white'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{unit.areaName || unit.unitId}</p>
                    <p className="text-xs text-slate-500">{unit.unitId} · {unit.areaType}</p>
                  </div>
                  {count > 0
                    ? <span className="text-xs bg-amber-500 text-slate-900 font-bold px-2 py-0.5 rounded-full">{count}</span>
                    : <span className="text-slate-600 text-sm">→</span>
                  }
                </button>
              )
            })}
          </div>

          {totalIssues > 0 && (
            <button
              disabled={submitting}
              onClick={handleSubmitAll}
              className="w-full mt-5 bg-amber-500 text-slate-900 font-bold py-3.5 rounded-xl hover:bg-amber-400 disabled:opacity-40 transition-colors"
            >
              {submitting ? 'Submitting…' : `Submit All ${totalIssues} Issue${totalIssues !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}

      {/* ── Screen: Area detail ── */}
      {screen === 'area-detail' && activeArea && (
        <div>
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => { setScreen('areas'); setNewIssue(null); setEditingIdx(null) }} className="text-slate-400 hover:text-white text-sm">←</button>
            <div>
              <h2 className="text-white font-semibold">{activeArea.unit.areaName || activeArea.unit.unitId}</h2>
              <p className="text-slate-500 text-xs">
                {activeArea.unit.unitId} · {activeArea.issues.length} issue{activeArea.issues.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
          </div>

          {/* Existing issues */}
          {activeArea.issues.map((issue, idx) => (
            <div key={idx} className={`bg-slate-800 rounded-xl p-4 mb-3 border ${URGENCY_BADGE[issue.urgency]}`}>
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${URGENCY_BADGE[issue.urgency]}`}>
                  {URGENCY_LABEL[issue.urgency]} · Issue #{idx + 1}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingIdx(idx); setNewIssue({ ...issue }) }}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Edit
                  </button>
                  <button onClick={() => removeIssue(idx)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                </div>
              </div>
              <p className="text-white text-sm">{issue.description}</p>
              {issue.notes && <p className="text-slate-400 text-xs mt-1">{issue.notes}</p>}
              <p className="text-slate-500 text-xs mt-1">{issue.defectType} · ~{issue.estimatedHours}h</p>
            </div>
          ))}

          {/* Issue form (new or edit) */}
          {newIssue !== null ? (
            <IssueForm
              issue={newIssue}
              onChange={setNewIssue}
              onSave={() => saveIssue(newIssue)}
              onCancel={() => { setNewIssue(null); setEditingIdx(null) }}
              isEdit={editingIdx !== null}
            />
          ) : editingIdx !== null && activeArea.issues[editingIdx] ? (
            <IssueForm
              issue={activeArea.issues[editingIdx]}
              onChange={(updated) => {
                const issues = [...activeArea.issues]
                issues[editingIdx] = updated
                const updated2 = { ...activeArea, issues }
                setAreas(prev => prev.map(a =>
                  a.unit.unitId === activeArea.unit.unitId && a.unit.areaName === activeArea.unit.areaName ? updated2 : a
                ))
                setActiveArea(updated2)
              }}
              onSave={() => { setEditingIdx(null) }}
              onCancel={() => setEditingIdx(null)}
              isEdit
            />
          ) : (
            <button
              onClick={() => setNewIssue(blankIssue())}
              className="w-full border-2 border-dashed border-slate-600 text-slate-400 hover:border-amber-500 hover:text-amber-400 rounded-xl py-4 text-sm font-medium transition-colors mt-1"
            >
              + New issue in this area
            </button>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => { setScreen('areas'); setNewIssue(null); setEditingIdx(null) }}
              className="flex-1 border border-slate-600 text-slate-300 py-3 rounded-xl text-sm hover:border-slate-400 hover:text-white transition-colors"
            >
              ← Back to areas
            </button>
            {activeArea.issues.length > 0 && (
              <button
                onClick={() => { setScreen('areas'); setNewIssue(null); setEditingIdx(null) }}
                className="flex-1 bg-slate-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-slate-600 transition-colors"
              >
                Done with this area
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Issue form sub-component ────────────────────────────────────────────
function IssueForm({
  issue, onChange, onSave, onCancel, isEdit
}: {
  issue: Issue
  onChange: (i: Issue) => void
  onSave: () => void
  onCancel: () => void
  isEdit: boolean
}) {
  function set<K extends keyof Issue>(key: K, val: Issue[K]) {
    onChange({ ...issue, [key]: val })
  }

  const canSave = issue.defectType && issue.description.trim()

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-600 mt-1">
      <p className="text-slate-300 text-sm font-medium mb-3">
        {isEdit ? 'Edit issue' : 'New issue'}
      </p>

      {/* Severity */}
      <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Severity</p>
      <div className="grid grid-cols-4 gap-1.5 mb-4">
        {URGENCY.map(u => (
          <button
            key={u.key}
            type="button"
            onClick={() => set('urgency', u.key)}
            className={`text-xs py-2 rounded-lg border font-medium transition-colors ${
              issue.urgency === u.key ? u.active : u.color
            }`}
          >
            {u.label}
          </button>
        ))}
      </div>

      {/* Defect type */}
      <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Type *</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {DEFECT_TYPES.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => set('defectType', t)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              issue.defectType === t
                ? 'bg-sky-700 border-sky-500 text-white'
                : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Description *</p>
      <textarea
        value={issue.description}
        onChange={e => set('description', e.target.value)}
        placeholder="Describe what you found…"
        rows={2}
        className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-sky-500 placeholder:text-slate-600 resize-none mb-3"
      />

      {/* Photos placeholder */}
      <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Photos</p>
      <div className="flex gap-2 mb-4">
        <label className="flex flex-col items-center justify-center w-16 h-16 rounded-lg border border-dashed border-slate-600 text-slate-500 hover:border-amber-500 hover:text-amber-400 cursor-pointer transition-colors text-xs">
          <input type="file" accept="image/*" capture="environment" className="hidden" />
          📷
          <span className="text-xs mt-0.5">Camera</span>
        </label>
        <label className="flex flex-col items-center justify-center w-16 h-16 rounded-lg border border-dashed border-slate-600 text-slate-500 hover:border-amber-500 hover:text-amber-400 cursor-pointer transition-colors">
          <input type="file" accept="image/*" multiple className="hidden" />
          🖼️
          <span className="text-xs mt-0.5">Gallery</span>
        </label>
      </div>

      {/* Est hours + notes */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Est. Hours</p>
          <input
            type="number" min="0.5" step="0.5"
            value={issue.estimatedHours}
            onChange={e => set('estimatedHours', parseFloat(e.target.value) || 1)}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Notes</p>
          <input
            type="text"
            value={issue.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Optional"
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          disabled={!canSave}
          onClick={onSave}
          className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-blue-500 disabled:opacity-40 transition-colors"
        >
          Save issue ✓
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-lg text-slate-400 hover:text-white text-sm transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
