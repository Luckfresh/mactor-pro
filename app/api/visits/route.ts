import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getAllVisits } from '@/lib/sheets/all-visits'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const building = searchParams.get('building') ?? undefined
  const unitId = searchParams.get('unitId') ?? undefined
  const source = searchParams.get('source') ?? undefined
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  // Managers: enforce building scope
  if (session.user.role === 'manager') {
    if (building && !session.user.buildings.includes(building)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  let visits = await getAllVisits({ building, unitId, source })

  // If manager and no building specified, filter to assigned buildings
  if (session.user.role === 'manager' && !building) {
    visits = visits.filter(v => session.user.buildings.includes(v.building))
  }

  visits = visits.sort((a, b) => b.date.localeCompare(a.date))
  if (limit && limit > 0) visits = visits.slice(0, limit)

  return NextResponse.json(visits)
}
