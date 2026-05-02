export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-5 py-4">
        <span className="bg-amber-500 text-white font-black text-sm px-3 py-1.5 rounded-lg">
          MACTOR
        </span>
      </header>
      <main className="max-w-lg mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
