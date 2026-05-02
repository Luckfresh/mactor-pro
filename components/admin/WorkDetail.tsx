'use client'

import { useState } from 'react'
import type { Visit } from '@/types'
import { PDFDownloadButton } from '@/components/shared/PDFDownloadButton'
import { formatDate } from '@/lib/hours'

interface WorkDetailProps {
  visit: Visit
}

const PHOTO_LABELS: Record<string, string> = {
  common: 'Área común', exterior: 'Exterior', windows: 'Ventanas',
  wallCeiling: 'Pared/Techo', bath: 'Baño', kitchen: 'Cocina',
  floor: 'Piso', electrical: 'Eléctrico', plumbing: 'Plomería',
  hvac: 'HVAC', extra: 'Extra', before: 'Antes', after: 'Después',
}

function PhotoLink({ url, label }: { url: string | null; label: string }) {
  if (!url) return null
  // Handle multiple URLs separated by ", "
  const urls = url.split(/,\s*/).filter(u => u.trim().startsWith('http'))
  if (urls.length === 0) return null
  const displayLabel = PHOTO_LABELS[label] ?? label
  return (
    <>
      {urls.map((u, i) => {
        const fileId = u.match(/id=([\w-]+)/)?.[1] ?? u.match(/\/d\/([\w-]+)/)?.[1]
        const href = fileId ? `https://drive.google.com/open?id=${fileId}` : u.trim()
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 bg-slate-700 hover:bg-slate-600 rounded-lg p-3 text-xs text-slate-300 transition-colors"
          >
            <span className="text-2xl">📷</span>
            <span>{displayLabel}{urls.length > 1 ? ` ${i + 1}` : ''}</span>
          </a>
        )
      })}
    </>
  )
}

export function WorkDetail({ visit }: WorkDetailProps) {
  const [open, setOpen] = useState(false)

  const photoEntries = Object.entries(visit.photos).filter(([, v]) => v !== null && v !== '')

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${visit.status === 'Completed' ? 'bg-green-400' : 'bg-amber-400'}`} />
          <div>
            <p className="text-white text-sm font-medium">{visit.visitType} — {visit.areaName}</p>
            <p className="text-slate-400 text-xs">{formatDate(visit.date)} · {visit.duration.toFixed(1)}h · {visit.technician}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {visit.materialCost > 0 && (
            <span className="text-green-400 text-sm font-medium">${visit.materialCost.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          )}
          <span className="text-slate-400 text-lg">{open ? '∧' : '∨'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-700 pt-4 space-y-4">
          {visit.problem && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Problema</p>
              <p className="text-slate-200 text-sm bg-slate-900 rounded-lg p-3">{visit.problem}</p>
            </div>
          )}
          {visit.workPerformed && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Trabajo realizado</p>
              <p className="text-slate-200 text-sm bg-slate-900 rounded-lg p-3 whitespace-pre-line">
                {visit.workPerformed}
              </p>
            </div>
          )}
          {photoEntries.length > 0 && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Fotos</p>
              <div className="flex flex-wrap gap-2">
                {photoEntries.map(([key, url]) => (
                  <PhotoLink key={key} url={url} label={key} />
                ))}
              </div>
            </div>
          )}
          <PDFDownloadButton
            payload={{ type: 'visit', building: visit.building, unitId: visit.unitId, date: visit.date }}
            filename={`visit-${visit.unitId}-${visit.date}.pdf`}
          />
        </div>
      )}
    </div>
  )
}
