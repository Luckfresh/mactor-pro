'use client'

import { useState } from 'react'
import { actionLookupReports } from '@/app/(tenant)/report/actions'
import type { TenantReport } from '@/types'
import Link from 'next/link'
import { use } from 'react'

const STATUS_COLOR: Record<string, string> = {
  Pending:  'bg-amber-100 text-amber-700',
  Approved: 'bg-blue-100 text-blue-700',
  Rejected: 'bg-red-100 text-red-700',
  Quoted:   'bg-purple-100 text-purple-700',
  Resolved: 'bg-green-100 text-green-700',
}

const STATUS_MSG: Record<string, string> = {
  Pending:  'Under review by the building manager.',
  Approved: 'Approved — repair scheduled.',
  Rejected: 'Not approved at this time.',
  Quoted:   'A quote has been prepared for private service.',
  Resolved: 'Resolved.',
}

interface Props {
  params: Promise<{ building: string; unitId: string }>
}

export default function StatusPage({ params }: Props) {
  const { building, unitId } = use(params)
  const decodedBuilding = decodeURIComponent(building)
  const decodedUnit = decodeURIComponent(unitId)

  const [contact, setContact] = useState('')
  const [reports, setReports] = useState<TenantReport[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function lookup(e: React.FormEvent) {
    e.preventDefault()
    if (!contact.trim()) return
    setLoading(true)
    setError('')
    const res = await actionLookupReports(decodedBuilding, decodedUnit, contact.trim())
    setLoading(false)
    if (res.ok) {
      setReports(res.reports ?? [])
    } else {
      setError(res.error ?? 'Lookup failed.')
    }
  }

  return (
    <div>
      <Link href={`/report/${building}/${unitId}`} className="text-gray-400 text-sm hover:text-gray-600">
        ← Submit a new report
      </Link>
      <h1 className="text-gray-900 text-2xl font-bold mt-4 mb-1">Report status</h1>
      <p className="text-gray-500 text-sm mb-6">Enter your phone or email to see your reports.</p>

      <form onSubmit={lookup} className="flex gap-2 mb-6">
        <input
          type="text"
          value={contact}
          onChange={e => setContact(e.target.value)}
          placeholder="Phone or email"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 bg-white text-gray-900 placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-amber-500 text-white font-bold px-5 py-3 rounded-xl text-sm hover:bg-amber-600 disabled:opacity-40 transition-colors"
        >
          {loading ? '…' : 'Look up'}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {reports !== null && reports.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-8">No reports found for this contact.</p>
      )}

      {reports !== null && reports.length > 0 && (
        <div className="flex flex-col gap-3">
          {reports.map(r => (
            <div key={r.reportId} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {r.status}
                </span>
                <span className="text-gray-400 text-xs">{r.date}</span>
              </div>
              <p className="text-gray-800 text-sm">{r.description}</p>
              <p className="text-gray-500 text-xs mt-1">{STATUS_MSG[r.status]}</p>
              {r.adminNotes && (
                <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                  <strong>Note from management:</strong> {r.adminNotes}
                </div>
              )}
              {r.status === 'Quoted' && r.quotedAmount > 0 && (
                <div className="mt-2 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700">
                  <strong>Quote:</strong> ${r.quotedAmount.toFixed(2)} — contact us to confirm.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
