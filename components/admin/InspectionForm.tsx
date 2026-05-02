'use client'

import { useState, useEffect, useCallback } from 'react'
import { actionSubmitInspection, type InspectionPayload } from '@/app/(admin)/inspect/actions'
import type { UnitSummary } from '@/types'

type CategoryKey = 'commonAreas' | 'exterior' | 'windows' | 'walls' | 'bathroom' | 'kitchen' | 'floor' | 'electrical' | 'plumbing' | 'hvac' | 'safety'
type CategoryStatus = 'OK' | 'Minor' | 'Urgent'

interface CategoryState {
  status: CategoryStatus
  notes: string
}

const CATEGORIES: { key: CategoryKey; label: string; icon: string; hint: string }[] = [
  { key: 'commonAreas', label: 'Áreas Comunes',  icon: '🏢', hint: 'Lobby, pasillos, escaleras, laundry' },
  { key: 'exterior',    label: 'Exterior',        icon: '🏗️', hint: 'Fachada, entrada, estacionamiento' },
  { key: 'windows',     label: 'Ventanas',        icon: '🪟', hint: 'Vidrios, marcos, sellado, cierres' },
  { key: 'walls',       label: 'Paredes',         icon: '🧱', hint: 'Pintura, grietas, humedad, daños' },
  { key: 'bathroom',    label: 'Baño',            icon: '🚿', hint: 'Sanitarios, grifería, caulking, ventilación' },
  { key: 'kitchen',     label: 'Cocina',          icon: '🍳', hint: 'Gabinetes, fregadero, grifería, silicón' },
  { key: 'floor',       label: 'Piso',            icon: '⬛', hint: 'Baldosas, parquet, alfombra, nivelación' },
  { key: 'electrical',  label: 'Eléctrico',       icon: '⚡', hint: 'Tomas, interruptores, luces, panel' },
  { key: 'plumbing',    label: 'Plomería',        icon: '🔧', hint: 'Fugas, presión, desagüe, calentador' },
  { key: 'hvac',        label: 'HVAC',            icon: '❄️', hint: 'Aire acondicionado, calefacción, ventilación' },
  { key: 'safety',      label: 'Seguridad',       icon: '🔒', hint: 'Detectores de humo, cerraduras, extintores' },
]

const TOTAL_STEPS = 13
const CATEGORY_START = 1

const blankCategories = (): Record<CategoryKey, CategoryState> =>
  Object.fromEntries(CATEGORIES.map(c => [c.key, { status: 'OK' as CategoryStatus, notes: '' }])) as Record<CategoryKey, CategoryState>

const QUEUE_KEY = 'inspection_queue_v2'
interface Queued extends InspectionPayload { queuedAt: string }
function loadQueue(): Queued[] { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') } catch { return [] } }
function saveQueue(q: Queued[]) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)) }

interface Props {
  unitsByBuilding: Record<string, UnitSummary[]>
}

export function InspectionForm({ unitsByBuilding }: Props) {
  const [step, setStep] = useState(0)
  const [building, setBuilding] = useState('')
  const [unit, setUnit] = useState<UnitSummary | null>(null)
  const [visitType, setVisitType] = useState<'Inspección' | 'Reparación'>('Inspección')
  const [tenantPresent, setTenantPresent] = useState(false)
  const [tenantName, setTenantName] = useState('')
  const [categories, setCategories] = useState<Record<CategoryKey, CategoryState>>(blankCategories)
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

  const buildPayload = useCallback((): InspectionPayload => ({
    building,
    unitId: unit?.unitId ?? '',
    areaName: unit?.areaName ?? unit?.unitId ?? '',
    areaType: unit?.areaType ?? '',
    visitType,
    tenantPresent,
    tenantName,
    categories: Object.fromEntries(
      CATEGORIES.map(c => [c.key, categories[c.key]])
    ),
  }), [building, unit, visitType, tenantPresent, tenantName, categories])

  const syncQueue = useCallback(async () => {
    const queue = loadQueue()
    if (!queue.length) return
    setSyncing(true)
    const remaining: Queued[] = []
    for (const { queuedAt, ...p } of queue) {
      const res = await actionSubmitInspection(p)
      if (!res.ok) remaining.push({ ...p, queuedAt })
    }
    saveQueue(remaining)
    setQueueCount(remaining.length)
    setSyncing(false)
  }, [])

  useEffect(() => { if (isOnline && queueCount > 0) syncQueue() }, [isOnline, queueCount, syncQueue])

  function setCategory(key: CategoryKey, patch: Partial<CategoryState>) {
    setCategories(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  function reset() {
    setStep(0)
    setBuilding('')
    setUnit(null)
    setVisitType('Inspección')
    setTenantPresent(false)
    setTenantName('')
    setCategories(blankCategories())
    setSubmitted(false)
    setError('')
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    const payload = buildPayload()

    if (!isOnline) {
      const queue = loadQueue()
      queue.push({ ...payload, queuedAt: new Date().toISOString() })
      saveQueue(queue)
      setQueueCount(queue.length)
      setSubmitted(true)
      setSubmitting(false)
      return
    }

    const res = await actionSubmitInspection(payload)
    setSubmitting(false)
    if (res.ok) {
      setSubmitted(true)
    } else {
      setError(res.error ?? 'Error al enviar')
    }
  }

  const progress = Math.round(((step + 1) / TOTAL_STEPS) * 100)
  const units = unitsByBuilding[building] ?? []
  const issueCount = CATEGORIES.filter(c => categories[c.key].status !== 'OK').length
  const urgentCount = CATEGORIES.filter(c => categories[c.key].status === 'Urgent').length

  // ── Submitted ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto bg-slate-800 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">{isOnline ? '✓' : '📶'}</div>
        <p className="text-white text-xl font-bold">
          {isOnline ? 'Inspección enviada' : 'Guardado sin conexión'}
        </p>
        <p className="text-slate-400 text-sm mt-2">
          {isOnline
            ? issueCount > 0
              ? `${issueCount} problema${issueCount !== 1 ? 's' : ''} registrado${issueCount !== 1 ? 's' : ''} · ${urgentCount} urgente${urgentCount !== 1 ? 's' : ''}`
              : 'Sin problemas detectados'
            : 'Se sincronizará cuando haya conexión.'}
        </p>
        {queueCount > 0 && <p className="text-amber-400 text-xs mt-2">{queueCount} pendiente de sincronizar</p>}
        <button
          onClick={reset}
          className="mt-6 bg-amber-500 text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-amber-400 transition-colors"
        >
          Nueva inspección
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      {!isOnline && (
        <div className="bg-amber-900/40 border border-amber-700 rounded-xl px-4 py-2 mb-4 text-amber-300 text-sm flex items-center gap-2">
          <span>📶</span><span>Sin conexión — se guardará al reconectar.</span>
        </div>
      )}
      {queueCount > 0 && isOnline && !syncing && (
        <div className="bg-sky-900/40 border border-sky-700 rounded-xl px-4 py-2 mb-4 text-sky-300 text-sm flex items-center justify-between">
          <span>{queueCount} inspección{queueCount > 1 ? 'es' : ''} pendiente{queueCount > 1 ? 's' : ''} de sync</span>
          <button onClick={syncQueue} className="text-xs underline">Sincronizar</button>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-700">
          <div
            className="h-full bg-sky-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-5 pt-4 pb-1 flex justify-between items-center">
          <span className="text-slate-500 text-xs">Paso {step + 1} de {TOTAL_STEPS}</span>
          {step > 0 && step < TOTAL_STEPS - 1 && (
            <span className="text-xs text-slate-500">{CATEGORIES[step - CATEGORY_START]?.label}</span>
          )}
        </div>

        <div className="px-5 pb-5 pt-2">

          {/* ── Step 0: Info General ─────────────────────────────────── */}
          {step === 0 && (
            <div>
              <h2 className="text-white text-lg font-bold mb-1">Info General</h2>
              <p className="text-slate-400 text-sm mb-5">Datos básicos de esta inspección</p>

              <div className="flex flex-col gap-4">
                {/* Building */}
                <div>
                  <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1.5">Edificio</label>
                  <select
                    value={building}
                    onChange={e => { setBuilding(e.target.value); setUnit(null) }}
                    className="w-full bg-slate-700 text-white rounded-lg px-3 py-2.5 text-sm border border-slate-600 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">Seleccionar...</option>
                    {Object.keys(unitsByBuilding).sort().map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1.5">Unidad / Área</label>
                  <select
                    value={unit?.unitId ?? ''}
                    onChange={e => setUnit(units.find(u => u.unitId === e.target.value) ?? null)}
                    disabled={!building}
                    className="w-full bg-slate-700 text-white rounded-lg px-3 py-2.5 text-sm border border-slate-600 focus:outline-none focus:border-sky-500 disabled:opacity-40"
                  >
                    <option value="">Seleccionar...</option>
                    {units.map(u => (
                      <option key={u.unitId} value={u.unitId}>
                        {u.areaName || u.unitId} — {u.areaType}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visit type */}
                <div>
                  <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1.5">Tipo de visita</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Inspección', 'Reparación'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setVisitType(t)}
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

                {/* Tenant present */}
                <div>
                  <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1.5">Inquilino presente</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTenantPresent(true)}
                      className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                        tenantPresent
                          ? 'bg-green-800 border-green-500 text-green-200'
                          : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      ✓ Sí
                    </button>
                    <button
                      onClick={() => setTenantPresent(false)}
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

                {/* Tenant name */}
                {tenantPresent && (
                  <div>
                    <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1.5">Nombre del inquilino</label>
                    <input
                      type="text"
                      value={tenantName}
                      onChange={e => setTenantName(e.target.value)}
                      placeholder="Nombre completo"
                      className="w-full bg-slate-700 text-white rounded-lg px-3 py-2.5 text-sm border border-slate-600 focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
                    />
                  </div>
                )}
              </div>

              <button
                disabled={!building || !unit}
                onClick={() => setStep(1)}
                className="w-full mt-6 bg-sky-600 text-white font-bold py-3 rounded-xl hover:bg-sky-500 disabled:opacity-40 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}

          {/* ── Steps 1-11: Category steps ───────────────────────────── */}
          {step >= CATEGORY_START && step < TOTAL_STEPS - 1 && (() => {
            const cat = CATEGORIES[step - CATEGORY_START]
            const state = categories[cat.key]
            return (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{cat.icon}</span>
                  <h2 className="text-white text-lg font-bold">{cat.label}</h2>
                </div>
                <p className="text-slate-400 text-sm mb-5">{cat.hint}</p>

                {/* Status buttons */}
                <label className="text-slate-400 text-xs uppercase tracking-wide block mb-2">Estado general</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => setCategory(cat.key, { status: 'OK' })}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                      state.status === 'OK'
                        ? 'bg-green-800/60 border-green-500 text-green-200'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-green-700'
                    }`}
                  >
                    ✓ OK
                  </button>
                  <button
                    onClick={() => setCategory(cat.key, { status: 'Minor' })}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                      state.status === 'Minor'
                        ? 'bg-amber-800/60 border-amber-500 text-amber-200'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-amber-700'
                    }`}
                  >
                    ⚠ Menor
                  </button>
                  <button
                    onClick={() => setCategory(cat.key, { status: 'Urgent' })}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                      state.status === 'Urgent'
                        ? 'bg-red-800/60 border-red-500 text-red-200'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-red-700'
                    }`}
                  >
                    🔴 Urgente
                  </button>
                </div>

                {/* Notes — shown when not OK */}
                {state.status !== 'OK' && (
                  <div className={`rounded-xl p-4 mb-4 border ${
                    state.status === 'Urgent'
                      ? 'bg-red-900/20 border-red-700'
                      : 'bg-amber-900/20 border-amber-700'
                  }`}>
                    <label className={`text-xs font-semibold block mb-2 ${
                      state.status === 'Urgent' ? 'text-red-300' : 'text-amber-300'
                    }`}>
                      Describe el problema
                    </label>
                    <textarea
                      value={state.notes}
                      onChange={e => setCategory(cat.key, { notes: e.target.value })}
                      placeholder="¿Qué observaste? Sé específico."
                      rows={3}
                      className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none resize-none placeholder:text-slate-600"
                    />
                    {/* Photo placeholder */}
                    <div className="mt-3">
                      <label className="flex flex-col items-center justify-center h-14 rounded-lg border-2 border-dashed border-slate-600 text-slate-500 hover:border-amber-500 hover:text-amber-400 cursor-pointer transition-colors">
                        <input type="file" accept="image/*" capture="environment" className="hidden" />
                        <span className="text-sm">📷 Agregar foto</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => setStep(s => s - 1)}
                    className="py-3 rounded-xl text-sm font-semibold border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white transition-colors"
                  >
                    ← Atrás
                  </button>
                  <button
                    onClick={() => setStep(s => s + 1)}
                    className="py-3 rounded-xl text-sm font-bold bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )
          })()}

          {/* ── Step 12: Resumen ─────────────────────────────────────── */}
          {step === TOTAL_STEPS - 1 && (
            <div>
              <div className="text-center mb-5">
                <div className="text-3xl mb-2">📋</div>
                <h2 className="text-white text-lg font-bold">Resumen de inspección</h2>
                <p className="text-slate-400 text-sm mt-0.5">
                  {unit?.areaName || unit?.unitId} · {building.replace('PHASE ', 'P')}
                  {tenantPresent && tenantName ? ` · ${tenantName}` : ''}
                </p>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                {CATEGORIES.map(c => {
                  const s = categories[c.key]
                  const borderColor = s.status === 'Urgent' ? 'border-l-red-500' : s.status === 'Minor' ? 'border-l-amber-500' : 'border-l-green-500'
                  return (
                    <div
                      key={c.key}
                      className={`flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2.5 border-l-4 ${borderColor}`}
                    >
                      <span className="text-slate-300 text-sm">{c.icon} {c.label}</span>
                      {s.status === 'OK' ? (
                        <span className="text-xs bg-green-900/40 text-green-300 px-2 py-0.5 rounded-full font-semibold">✓ OK</span>
                      ) : s.status === 'Minor' ? (
                        <span className="text-xs bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full font-semibold">⚠ Menor</span>
                      ) : (
                        <span className="text-xs bg-red-900/40 text-red-300 px-2 py-0.5 rounded-full font-semibold">🔴 Urgente</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {issueCount > 0 ? (
                <div className="bg-sky-900/30 border border-sky-800 rounded-xl px-4 py-3 mb-5">
                  <p className="text-sky-300 text-sm font-semibold">
                    {issueCount} problema{issueCount !== 1 ? 's' : ''} encontrado{issueCount !== 1 ? 's' : ''}
                    {urgentCount > 0 ? ` · ${urgentCount} urgente${urgentCount !== 1 ? 's' : ''}` : ''}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Al enviar se generarán {issueCount} orden{issueCount !== 1 ? 'es' : ''} de trabajo en estado Reported.
                  </p>
                </div>
              ) : (
                <div className="bg-green-900/20 border border-green-800 rounded-xl px-4 py-3 mb-5">
                  <p className="text-green-300 text-sm font-semibold">✓ Sin problemas detectados</p>
                  <p className="text-slate-400 text-xs mt-1">Se guardará el registro de inspección.</p>
                </div>
              )}

              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="py-3 rounded-xl text-sm font-semibold border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white transition-colors"
                >
                  ← Atrás
                </button>
                <button
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="py-3 rounded-xl text-sm font-bold bg-green-700 text-white hover:bg-green-600 disabled:opacity-40 transition-colors"
                >
                  {submitting ? 'Enviando…' : '✓ Enviar inspección'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
