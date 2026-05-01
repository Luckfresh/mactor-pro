import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getUnitsSummary } from '@/lib/sheets/units-summary'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const building = searchParams.get('building') ?? undefined

  if (session.user.role === 'manager' && building) {
    if (!session.user.buildings.includes(building)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  let units = await getUnitsSummary(building)

  if (session.user.role === 'manager' && !building) {
    units = units.filter(u => session.user.buildings.includes(u.building))
  }

  return NextResponse.json(units)
}
