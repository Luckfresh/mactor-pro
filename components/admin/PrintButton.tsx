'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-white border border-gray-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
    >
      Print all
    </button>
  )
}
