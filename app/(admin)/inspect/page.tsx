import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { InspectionForm } from '@/components/admin/InspectionForm'
import Link from 'next/link'

export default async function InspectPage() {
  const session = await auth()
  if (session?.user.role !== 'admin') redirect('/')

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-slate-400 text-sm hover:text-white">← Dashboard</Link>
        <h1 className="text-white text-2xl font-bold mt-2">Inspect</h1>
        <p className="text-slate-400 text-sm mt-1">Field inspection form — works offline.</p>
      </div>
      <InspectionForm />
    </div>
  )
}
