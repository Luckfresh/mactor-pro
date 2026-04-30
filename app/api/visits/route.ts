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
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

  // Managers can only query their assigned buildings
  if (session.user.role === 'manager' && building) {
    if (!session.user.buildings.includes(building)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  let visits = await getAllVisits({ building, unitId, source })
  visits = visits.sort((a, b) => b.date.localeCompare(a.date))
  if (limit) visits = visits.slice(0, limit)

  return NextResponse.json(visits)
}
