'use client'

import { useState } from 'react'
import { actionSubmitTenantReport } from '@/app/(tenant)/report/actions'
import Link from 'next/link'

const URGENCIES = [
  { key: 'Low',       label: 'Not urgent',  color: 'border-gray-300 text-gray-600',   active: 'border-green-500 bg-green-50 text-green-700' },
  { key: 'Medium',    label: 'Minor',       color: 'border-gray-300 text-gray-600',   active: 'border-amber-500 bg-amber-50 text-amber-700' },
  { key: 'High',      label: 'Important',   color: 'border-gray-300 text-gray-600',   active: 'border-orange-500 bg-orange-50 text-orange-700' },
  { key: 'Emergency', label: 'Emergency',   color: 'border-gray-300 text-gray-600',   active: 'border-red-500 bg-red-50 text-red-700' },
]

interface Props {
  building: string
  unitId: string
  areaName: string
}

export function ReportForm({ building, unitId, areaName }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [urgency, setUrgency] = useState('Medium')
  const [description, setDescription] = useState('')
  const [wantsQuote, setWantsQuote] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await actionSubmitTenantReport({ building, unitId, tenantName: name, phone, email, description, urgency, wantsQuote })
    setSubmitting(false)
    if (res.ok && res.reportId) {
      setDone(res.reportId)
    } else {
      setError(res.error ?? 'Something went wrong.')
    }
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="text-gray-900 text-xl font-bold mb-2">Report submitted</h2>
        <p className="text-gray-500 text-sm mb-1">We've received your report for <strong>{areaName || unitId}</strong>.</p>
        <p className="text-gray-500 text-sm mb-6">The building manager will review it shortly.</p>
        <Link
          href={`/report/${encodeURIComponent(building)}/${encodeURIComponent(unitId)}/status`}
          className="text-amber-600 text-sm font-medium hover:underline"
        >
          Check your report status →
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-1">Unit</p>
        <p className="text-gray-900 font-semibold">{areaName || unitId}</p>
        <p className="text-gray-400 text-xs">{building}</p>
      </div>

      <div>
        <label className="text-gray-700 text-sm font-medium block mb-1">Your name *</label>
        <input
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Full name"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 bg-white text-gray-900 placeholder:text-gray-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-700 text-sm font-medium block mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="416-000-0000"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 bg-white text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-gray-700 text-sm font-medium block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 bg-white text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>
      <p className="text-gray-400 text-xs -mt-3">Phone or email required to track your report status.</p>

      <div>
        <label className="text-gray-700 text-sm font-medium block mb-2">Urgency *</label>
        <div className="grid grid-cols-2 gap-2">
          {URGENCIES.map(u => (
            <button
              key={u.key}
              type="button"
              onClick={() => setUrgency(u.key)}
              className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${urgency === u.key ? u.active : u.color + ' bg-white hover:bg-gray-50'}`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-gray-700 text-sm font-medium block mb-1">Describe the problem *</label>
        <textarea
          required
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What's happening? Where exactly?"
          rows={4}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 bg-white text-gray-900 placeholder:text-gray-400 resize-none"
        />
      </div>

      <div>
        <label className="text-gray-700 text-sm font-medium block mb-2">Photos (optional)</label>
        <div className="flex gap-2">
          <label className="flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-amber-400 hover:text-amber-500 cursor-pointer transition-colors text-xs gap-1">
            <input type="file" accept="image/*" capture="environment" className="hidden" />
            <span className="text-xl">📷</span>
            <span>Camera</span>
          </label>
          <label className="flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-amber-400 hover:text-amber-500 cursor-pointer transition-colors text-xs gap-1">
            <input type="file" accept="image/*" multiple className="hidden" />
            <span className="text-xl">🖼️</span>
            <span>Gallery</span>
          </label>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={wantsQuote}
          onChange={e => setWantsQuote(e.target.checked)}
          className="mt-0.5 accent-amber-500 w-4 h-4"
        />
        <div>
          <p className="text-gray-700 text-sm font-medium">I'd also like a quote for private services</p>
          <p className="text-gray-400 text-xs">For work outside the building's maintenance plan — billed directly to you.</p>
        </div>
      </label>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-amber-500 text-white font-bold py-4 rounded-xl text-base hover:bg-amber-600 disabled:opacity-40 transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit Report'}
      </button>

      <Link
        href={`/report/${encodeURIComponent(building)}/${encodeURIComponent(unitId)}/status`}
        className="text-center text-gray-400 text-sm hover:text-gray-600"
      >
        Check existing report status
      </Link>
    </form>
  )
}
