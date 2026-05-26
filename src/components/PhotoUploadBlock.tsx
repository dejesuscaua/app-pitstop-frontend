import { useRef, useState, useId } from 'react'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/services/firebase'

interface Props {
  readonly label: string
  readonly storagePath: string
  readonly urls: string[]
  readonly onAdd: (url: string) => void
  readonly onRemove: (url: string) => void
  readonly accept?: string
  readonly maxFiles?: number
}

export function PhotoUploadBlock({
  label,
  storagePath,
  urls,
  onAdd,
  onRemove,
  accept = 'image/*',
  maxFiles,
}: Props) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const canAdd = maxFiles == null || urls.length < maxFiles

  const handleFiles = async (files: FileList) => {
    const list = Array.from(files)
    if (!list.length) return
    setUploading(true)
    setProgress(0)
    setError(null)

    for (const file of list) {
      const path = `${storagePath}/${Date.now()}_${file.name}`
      const sRef = storageRef(storage, path)
      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(sRef, file)
        task.on(
          'state_changed',
          (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          () => reject(new Error('Erro no upload')),
          async () => {
            try {
              const url = await getDownloadURL(task.snapshot.ref)
              onAdd(url)
              resolve()
            } catch {
              reject(new Error('Erro ao obter URL'))
            }
          },
        )
      }).catch(() => {
        setError('Erro ao enviar foto. Tente novamente.')
      })
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>

      {/* Thumbnails */}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {urls.map((url) => (
            <div key={url} className="relative">
              <img
                src={url}
                alt="foto"
                className="h-20 w-20 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white text-xs leading-none hover:opacity-80"
                aria-label="Remover foto"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {canAdd && (
        <>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept={accept}
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={uploading}
            className="hidden"
          />
          <label
            htmlFor={inputId}
            className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-4 text-sm font-medium transition-colors cursor-pointer
              ${uploading
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-brand-300 text-brand-600 hover:bg-brand-50'
              }`}
          >
            {uploading ? `Enviando… ${progress}%` : '+ Adicionar fotos'}
          </label>
          {uploading && (
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-brand-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </>
      )}

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
