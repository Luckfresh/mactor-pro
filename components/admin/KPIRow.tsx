import Link from 'next/link'

interface KPITile {
  label: string
  value: string | number
  sub?: string
  alert?: boolean
  href?: string
}

interface KPIRowProps {
  tiles: KPITile[]
}

export function KPIRow({ tiles }: KPIRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {tiles.map(tile => {
        const inner = (
          <div className="bg-slate-800 rounded-xl p-4 h-full">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{tile.label}</p>
            <p className={`text-2xl font-bold ${tile.alert ? 'text-red-400' : 'text-white'}`}>
              {tile.value}
            </p>
            {tile.sub && (
              <p className={`text-xs mt-1 ${tile.alert ? 'text-red-400' : 'text-sky-400'}`}>
                {tile.sub}
              </p>
            )}
          </div>
        )
        return tile.href ? (
          <Link key={tile.label} href={tile.href} className="block hover:opacity-80 transition-opacity">
            {inner}
          </Link>
        ) : (
          <div key={tile.label}>{inner}</div>
        )
      })}
    </div>
  )
}
