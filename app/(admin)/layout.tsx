import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { NavBar } from '@/components/shared/NavBar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { role } = session.user
  if (role !== 'admin' && role !== 'manager') redirect('/login')
  const navRole = role as 'admin' | 'manager'

  return (
    <div className="flex h-screen bg-gray-50">
      <NavBar
        userName={session.user.name ?? ''}
        role={navRole}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
