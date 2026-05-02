import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getAllVisits } from '@/lib/sheets/all-visits'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { VisitReportPDF } from '@/lib/pdf/visit-report'
import { getCurrentCycleLabel, getCycleDates } from '@/lib/hours'
import React, { type JSXElementConstructor, type ReactElement } from 'react'

const CYCLE_DAY_START = 25

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { type, building, unitId, date, source } = body as {
    type: string
    building: string
    unitId: string
    date: string
    source?: string
  }

  if (session.user.role === 'manager' && !session.user.buildings.includes(building)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (type !== 'visit') {
    return NextResponse.json({ error: 'Unsupported report type' }, { status: 400 })
  }

  const unitVisits = await getAllVisits({ building, unitId })

  // Find exact visit: match date AND source to avoid confusion between
  // inspection and repair visits on the same date
  const visit = source
    ? unitVisits.find(v => v.date === date && v.source === source)
    : unitVisits.find(v => v.date === date)

  if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })

  // Cycle-only summary (not all-time totals)
  const cycleLabel = getCurrentCycleLabel(CYCLE_DAY_START)
  const { start: cycleStart, end: cycleEnd } = getCycleDates(CYCLE_DAY_START, cycleLabel)
  const cycleVisits = unitVisits.filter(v => v.date >= cycleStart && v.date <= cycleEnd)
  const cycleHours = Math.round(cycleVisits.reduce((s, v) => s + v.duration, 0) * 10) / 10
  const cycleCost = cycleVisits.reduce((s, v) => s + v.materialCost, 0)

  const element = React.createElement(VisitReportPDF, {
    visit,
    cycleVisits: cycleVisits.length,
    cycleHours,
    cycleCost,
    cycleLabel,
  }) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<DocumentProps>>

  const buffer = await renderToBuffer(element)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="visit-${unitId}-${date}.pdf"`,
    },
  })
}
