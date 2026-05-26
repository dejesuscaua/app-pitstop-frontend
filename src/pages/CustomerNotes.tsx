import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/Navbar'
import { useCustomers } from '@/hooks/useCustomers'
import type { NotaFiscal } from '@/types'
import api from '@/services/api'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function CustomerNotes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tenantId, user } = useAuth()
  const { customers } = useCustomers()
  const customer = customers.find((c) => c.id === id)

  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    api.get<NotaFiscal[]>(`/customers/${id}/notas`)
      .then(({ data }) => setNotas(data))
      .catch(() => setError('Erro ao carregar notas fiscais'))
      .finally(() => setLoading(false))
  }, [id])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id || !user) return

    if (!tenantId) return

    const timestamp = Date.now()
    const path = `tenants/${tenantId}/customers/${id}/notas/${timestamp}_${file.name}`
    const sRef = storageRef(storage, path)

    setUploading(true)
    setProgress(0)
    setError(null)

    const task = uploadBytesResumable(sRef, file)
    task.on(
      'state_changed',
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => {
        setError('Erro no upload. Tente novamente.')
        setUploading(false)
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(task.snapshot.ref)
          const { data } = await api.post<NotaFiscal>(`/customers/${id}/notas`, {
            fileName: file.name,
            size: file.size,
            storagePath: path,
            downloadURL,
          })
          setNotas((prev) => [data, ...prev])
        } catch {
          setError('Erro ao salvar metadados. O arquivo foi enviado mas não registrado.')
        } finally {
          setUploading(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      },
    )
  }

  const handleDelete = async (nota: NotaFiscal) => {
    if (!id || !confirm(`Excluir "${nota.fileName}"?`)) return
    try {
      const sRef = storageRef(storage, nota.storagePath)
      await deleteObject(sRef)
    } catch {
      // file may already be gone
    }
    await api.delete(`/customers/${id}/notas/${nota.id}`)
    setNotas((prev) => prev.filter((n) => n.id !== nota.id))
  }

  const handleDownload = (nota: NotaFiscal) => {
    const a = document.createElement('a')
    a.href = nota.downloadURL
    a.download = nota.fileName
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  }

  const renderList = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
        </div>
      )
    }
    if (notas.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400">
          Nenhuma nota fiscal salva ainda.
        </div>
      )
    }
    return notas.map((nota) => (
      <div key={nota.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{nota.fileName}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatBytes(nota.size)} · {formatDate(nota.uploadedAt)}
          </p>
        </div>
        <button
          onClick={() => handleDownload(nota)}
          className="shrink-0 text-xs text-brand-600 hover:underline"
        >
          Baixar
        </button>
        <button
          onClick={() => handleDelete(nota)}
          className="shrink-0 text-xs text-red-500 hover:underline"
        >
          Excluir
        </button>
      </div>
    ))
  }

  return (
    <div>
      <Navbar title={`Notas fiscais — ${customer?.name ?? '…'}`} />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">

        {/* Upload area */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Adicionar nota fiscal</h3>
          <p className="text-xs text-gray-500 mb-3">
            Aceita PDF, imagem (JPG, PNG) ou XML. Máximo 10 MB.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.xml"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="nota-upload"
          />
          <label
            htmlFor="nota-upload"
            className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm font-medium transition-colors cursor-pointer
              ${uploading
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-brand-300 text-brand-600 hover:bg-brand-50'
              }`}
          >
            {uploading ? (
              <span>Enviando… {progress}%</span>
            ) : (
              <span>Clique para selecionar arquivo</span>
            )}
          </label>
          {uploading && (
            <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-brand-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>

        {/* List */}
        <div className="space-y-2">
          {renderList()}
        </div>

        <button
          onClick={() => navigate('/customers')}
          className="text-sm text-gray-500 hover:underline"
        >
          ← Voltar para clientes
        </button>
      </div>
    </div>
  )
}
