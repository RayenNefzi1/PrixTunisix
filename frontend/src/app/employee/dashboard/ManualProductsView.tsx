'use client'

import { useEffect, useState } from 'react'
import { FileSpreadsheet, Check, X, Clock } from 'lucide-react'
import employeeApi from '@/lib/employee-api'

interface ManualProduct {
  id: number
  request_id: number
  name: string
  description: string | null
  price: number | null
  image_url: string | null
  reference: string | null
  category_id: number | null
  brand_id: number | null
  status: string
  rejection_reason: string | null
  created_at: string
}

interface Request {
  id: number
  fournisseur_id: number
  file_name: string
  total_rows: number
  status: string
  created_at: string
  fournisseur?: {
    company_name: string
  }
  products?: ManualProduct[]
}

export default function ManualProductsView() {
  const [requests, setRequests] = useState<Request[]>([])
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [products, setProducts] = useState<ManualProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = () => {
    setLoading(true)
    employeeApi.get('/employee/manual-product-requests')
      .then(res => setRequests(res.data.requests || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const fetchProducts = (requestId: number) => {
    setLoadingProducts(true)
    employeeApi.get(`/employee/manual-products/${requestId}`)
      .then(res => setProducts(res.data.products || []))
      .catch(console.error)
      .finally(() => setLoadingProducts(false))
  }

  const selectRequest = (req: Request) => {
    setSelectedRequest(req)
    fetchProducts(req.id)
  }

  const handleApprove = async (productId: number) => {
    try {
      await employeeApi.post(`/employee/manual-products/${productId}/approve`)
      setProducts(products.map(p => p.id === productId ? { ...p, status: 'approved' } : p))
    } catch (err) {
      console.error(err)
    }
  }

  const handleReject = async (productId: number) => {
    const reason = prompt('Raison du rejet:')
    if (!reason) return
    try {
      await employeeApi.post(`/employee/manual-products/${productId}/reject`, { reason })
      setProducts(products.map(p => p.id === productId ? { ...p, status: 'rejected', rejection_reason: reason } : p))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Produits Manuels</h1>
        <p className="text-gray-500">Validez les produits uploadés par les fournisseurs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="font-bold text-gray-900 mb-4">Demandes</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune demande</p>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <button
                  key={req.id}
                  onClick={() => selectRequest(req)}
                  className={`w-full text-left p-3 rounded-lg border ${
                    selectedRequest?.id === req.id 
                      ? 'border-brand-500 bg-brand-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900 text-sm">{req.file_name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {req.fournisseur?.company_name || 'Fournisseur'} • {req.total_rows} produits
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      req.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      req.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="font-bold text-gray-900 mb-4">
            {selectedRequest ? `Produits - ${selectedRequest.file_name}` : 'Sélectionnez une demande'}
          </h2>
          
          {!selectedRequest ? (
            <div className="text-center py-12 text-gray-500">
              <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>Sélectionnez une demande pour voir les produits</p>
            </div>
          ) : loadingProducts ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun produit</p>
          ) : (
            <div className="space-y-3">
              {products.map(product => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {product.description && (
                        <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        {product.price && <span className="font-medium text-green-600">{product.price} DT</span>}
                        {product.reference && <span>Réf: {product.reference}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleApprove(product.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Approuver"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleReject(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Rejeter"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {product.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                        </span>
                      )}
                    </div>
                  </div>
                  {product.rejection_reason && (
                    <p className="text-xs text-red-500 mt-2">Motif: {product.rejection_reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}