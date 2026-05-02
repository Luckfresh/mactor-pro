'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
    >
      🖨 Print all
    </button>
  )
}
