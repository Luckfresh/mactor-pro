import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getAllVisits } from '@/lib/sheets/all-visits'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { VisitReportPDF } from '@/lib/pdf/visit-report'
import React, { type JSXElementConstructor, type ReactElement } from 'react'

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { type, building, unitId, date } = body as {
    type: string
    building: string
    unitId: string
    date: string
  }

  if (type !== 'visit') {
    return NextResponse.json({ error: 'Unsupported report type' }, { status: 400 })
  }

  const unitVisits = await getAllVisits({ building, unitId })
  const visit = unitVisits.find(v => v.date === date)
  if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })

  const totalHours = Math.round(unitVisits.reduce((s, v) => s + v.duration, 0) * 10) / 10
  const totalCost = unitVisits.reduce((s, v) => s + v.materialCost, 0)

  const element = React.createElement(VisitReportPDF, {
    visit,
    totalVisits: unitVisits.length,
    totalHours,
    totalCost,
  }) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<DocumentProps>>

  const buffer = await renderToBuffer(element)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="visit-${unitId}-${date}.pdf"`,
    },
  })
}
