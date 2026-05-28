'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Upload, FileSpreadsheet, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react'

interface Request {
  id: number
  file_name: string
  file_type: string
  total_rows: number
  processed_rows: number
  status: string
  created_at: string
}

export default function ManualProductsUploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('fournisseur_token')
    if (!token) {
      router.push('/fournisseur/login')
      return
    }
    fetchRequests()
  }, [router])

  const fetchRequests = () => {
    api.get('/fournisseur/manual-products/requests')
      .then(res => setRequests(res.data.requests || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('/fournisseur/manual-products/upload', formData)
      setFile(null)
      setError(null)
      fetchRequests()
      alert(res.data.message || 'Upload réussi!')
    } catch (err: any) {
      console.error('Upload error:', err.response?.data)
      const msg = err.response?.data?.message || err.response?.data?.errors?.file?.[0] || 'Erreur lors de l\'upload'
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'processing': return 'En cours'
      case 'completed': return 'Terminé'
      case 'rejected': return 'Rejeté'
      default: return status
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/fournisseur" className="text-sm text-gray-500 hover:text-brand-600 mb-4 inline-flex items-center gap-1">
        ← Retour au tableau de bord
      </Link>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Ajouter des produits manuellement</h1>
      <p className="text-gray-500 mb-8">Uploadez un fichier Excel ou CSV avec vos produits</p>

      {/* Upload Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Glissez un fichier ici ou cliquez pour sélectionner</p>
          <p className="text-xs text-gray-400 mb-4">Formats acceptés: CSV, XLS, XLSX (max 10MB)</p>
          <input
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200"
          >
            Sélectionner un fichier
          </label>
          {file && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-700">{file.name}</span>
              <button onClick={() => setFile(null)} className="text-blue-600 hover:text-blue-800">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {uploading ? 'Upload en cours...' : 'Uploader le fichier'}
          </button>
        )}
      </div>

      {/* Requests History */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Historique des uploads</h2>
      
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun upload pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{req.file_name}</p>
                <p className="text-sm text-gray-500">
                  {req.total_rows} lignes • {new Date(req.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(req.status)}
                <span className={`text-sm ${
                  req.status === 'completed' ? 'text-green-600' :
                  req.status === 'rejected' ? 'text-red-600' :
                  req.status === 'processing' ? 'text-blue-600' :
                  'text-yellow-600'
                }`}>
                  {getStatusText(req.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}