'use client'

import { useState, useRef } from 'react'

interface Props {
  label: string
  folderPath?: string   // e.g. "Work Orders/WO-1234" or "Inspections/INS-5678"
  onUploaded: (url: string) => void
  onClear?: () => void
  value?: string
}

async function compressImage(file: File, maxWidthPx = 1280, quality = 0.75): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxWidthPx / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')), 'image/jpeg', quality)
    }
    img.onerror = reject
    img.src = url
  })
}

export function PhotoUpload({ label, folderPath, onUploaded, onClear, value }: Props) {
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError('')
    setProgress(0)
    try {
      const compressed = await compressImage(file)
      setProgress(20)

      const fd = new FormData()
      fd.append('file', new File([compressed], 'photo.jpg', { type: 'image/jpeg' }))
      fd.append('label', label)
      if (folderPath) fd.append('path', folderPath)

      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) setProgress(20 + Math.round((e.loaded / e.total) * 75))
      }

      const result = await new Promise<{ url?: string; error?: string }>((resolve, reject) => {
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)) } catch { reject(new Error('Invalid response')) }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.open('POST', '/api/upload-photo')
        xhr.send(fd)
      })

      setProgress(100)
      setTimeout(() => setProgress(null), 600)

      if (result.error) throw new Error(result.error)
      onUploaded(result.url!)
    } catch (err) {
      setProgress(null)
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-lg">
        <a href={value} target="_blank" rel="noreferrer" className="text-green-700 text-xs font-semibold underline underline-offset-2 truncate flex-1">
          Photo uploaded ✓
        </a>
        {onClear && (
          <button onClick={onClear} className="text-slate-400 hover:text-red-500 text-xs shrink-0">Remove</button>
        )}
      </div>
    )
  }

  return (
    <div>
      <label
        className={`flex flex-col items-center justify-center h-12 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
          progress !== null
            ? 'border-indigo-300 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:text-indigo-500'
        } text-slate-400`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {progress !== null ? (
          <div className="w-full px-4">
            <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-200 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] text-indigo-600 text-center mt-1">{progress < 100 ? 'Uploading…' : 'Done'}</p>
          </div>
        ) : (
          <span className="text-xs">📷 Add photo</span>
        )}
      </label>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
