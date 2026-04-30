interface KPITile {
  label: string
  value: string | number
  sub?: string
  alert?: boolean
}

interface KPIRowProps {
  tiles: KPITile[]
}

export function KPIRow({ tiles }: KPIRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {tiles.map(tile => (
        <div key={tile.label} className="bg-slate-800 rounded-xl p-4">
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
      ))}
    </div>
  )
}
