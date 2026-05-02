import Link from 'next/link'

interface KPITile {
  label: string
  value: string | number
  sub?: string
  alert?: boolean
  warn?: boolean
  href?: string
}

interface KPIRowProps {
  tiles: KPITile[]
}

export function KPIRow({ tiles }: KPIRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {tiles.map(tile => {
        const borderAccent = tile.alert
          ? 'border-l-4 border-l-indigo-500'
          : tile.warn
          ? 'border-l-4 border-l-amber-400'
          : ''

        const inner = (
          <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full hover:shadow-md hover:border-gray-300 transition-all ${borderAccent}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{tile.label}</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1.5">
              {tile.value}
            </p>
            {tile.sub && (
              <p className={`text-xs font-medium ${
                tile.alert ? 'text-indigo-600' :
                tile.warn  ? 'text-amber-600' :
                tile.sub.includes('✓') ? 'text-green-600' :
                'text-slate-500'
              }`}>
                {tile.sub}
              </p>
            )}
          </div>
        )
        return tile.href ? (
          <Link key={tile.label} href={tile.href} className="block">
            {inner}
          </Link>
        ) : (
          <div key={tile.label}>{inner}</div>
        )
      })}
    </div>
  )
}
