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

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar
        userName={session.user.name ?? ''}
        role={session.user.role}
      />
      <main className="p-6">{children}</main>
    </div>
  )
}
