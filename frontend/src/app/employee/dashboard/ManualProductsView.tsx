'use client'

import { useEffect, useState } from 'react'
import { FileSpreadsheet, Check, X, Clock, Search, Tag, Package, Eye } from 'lucide-react'
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

interface Category {
  id: number
  name: string
}

interface Brand {
  id: number
  name: string
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
}

export default function ManualProductsView() {
  const [requests, setRequests] = useState<Request[]>([])
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [products, setProducts] = useState<ManualProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ManualProduct | null>(null)
  const [matchBy, setMatchBy] = useState<'name' | 'reference'>('name')
  const [suggestions, setSuggestions] = useState<{id: number, name: string}[]>([])

  useEffect(() => {
    fetchRequests()
    employeeApi.get('/employee/categories').then(res => setCategories(res.data.data || [])).catch(console.error)
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

  const selectProduct = async (product: ManualProduct) => {
    setSelectedProduct(product)
    setSuggestions([])
    
    if (matchBy === 'reference' && product.reference) {
      try {
        const res = await employeeApi.get(`/employee/products?q=${product.reference}&page=1`)
        const prods = res.data.data || []
        setSuggestions(prods.slice(0, 5).map((p: any) => ({ id: p.id, name: p.name })))
      } catch {}
    } else if (matchBy === 'name' && product.name) {
      try {
        const res = await employeeApi.get(`/employee/products?q=${encodeURIComponent(product.name)}&page=1`)
        const prods = res.data.data || []
        setSuggestions(prods.slice(0, 5).map((p: any) => ({ id: p.id, name: p.name })))
      } catch {}
    }
  }

  const handleApprove = async (productId: number) => {
    try {
      await employeeApi.post(`/employee/manual-products/${productId}/approve`)
      setProducts(products.map(p => p.id === productId ? { ...p, status: 'approved' } : p))
      setSelectedProduct(null)
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
      setSelectedProduct(null)
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
                      <button
                        onClick={() => selectProduct(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Voir/Modifier"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Détails du produit</h3>
              <button onClick={() => setSelectedProduct(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={selectedProduct.name}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={selectedProduct.description || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix</label>
                  <input
                    type="text"
                    value={selectedProduct.price ? `${selectedProduct.price} DT` : '-'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
                  <input
                    type="text"
                    value={selectedProduct.reference || '-'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher par</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setMatchBy('name'); selectProduct(selectedProduct) }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      matchBy === 'name' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Nom
                  </button>
                  <button
                    onClick={() => { setMatchBy('reference'); selectProduct(selectedProduct) }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      matchBy === 'reference' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Référence
                  </button>
                </div>
              </div>

              {suggestions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Produits suggérés</label>
                  <div className="space-y-2">
                    {suggestions.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{s.name}</span>
                        <button
                          onClick={() => handleApprove(selectedProduct.id)}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                        >
                          Approuver comme ceci
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => handleApprove(selectedProduct.id)}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Approuver
                </button>
                <button
                  onClick={() => handleReject(selectedProduct.id)}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Rejeter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}