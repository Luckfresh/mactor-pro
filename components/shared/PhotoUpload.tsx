'use client'

import { useState, useRef } from 'react'

interface Props {
  label: string
  folderPath?: string
  onUploaded: (value: string) => void  // comma-separated URLs
  onClear?: () => void
  value?: string  // comma-separated URLs
  maxPhotos?: number
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

export function PhotoUpload({ label, folderPath, onUploaded, onClear, value, maxPhotos = 5 }: Props) {
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const photoUrls = value ? value.split(',').map(u => u.trim()).filter(Boolean) : []
  const canAddMore = photoUrls.length < maxPhotos

  function removePhoto(idx: number) {
    const updated = photoUrls.filter((_, i) => i !== idx)
    if (updated.length === 0) {
      onClear?.()
      onUploaded('')
    } else {
      onUploaded(updated.join(', '))
    }
  }

  async function handleFile(file: File) {
    setError('')
    setProgress(0)
    try {
      const compressed = await compressImage(file)
      setProgress(20)

      const fd = new FormData()
      fd.append('file', new File([compressed], 'photo.jpg', { type: 'image/jpeg' }))
      fd.append('label', `${label}-${photoUrls.length + 1}`)
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

      const updated = [...photoUrls, result.url!].join(', ')
      onUploaded(updated)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setProgress(null)
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Uploaded photos grid */}
      {photoUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photoUrls.map((url, i) => {
            const fileId = url.match(/id=([\w-]+)/)?.[1]
            const thumb = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w120` : url
            return (
              <div key={i} className="relative group w-16 h-16">
                <img
                  src={thumb}
                  alt={`${label} ${i + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload button */}
      {canAddMore && (
        <label className={`flex flex-col items-center justify-center h-12 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
          progress !== null ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:text-indigo-500'
        } text-slate-400`}>
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
              <p className="text-[10px] text-indigo-600 text-center mt-1">{progress < 100 ? 'Subiendo…' : 'Listo'}</p>
            </div>
          ) : (
            <span className="text-xs">📷 {photoUrls.length > 0 ? 'Agregar otra foto' : 'Agregar foto'}</span>
          )}
        </label>
      )}

      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  )
}
