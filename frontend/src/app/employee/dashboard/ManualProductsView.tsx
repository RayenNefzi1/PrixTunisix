'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileSpreadsheet, Check, X, Clock, Search, Tag, Package, Eye, Link2, Image } from 'lucide-react'
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

interface Product {
  id: number
  name: string
  image_url: string | null
  reference: string | null
  category?: { name: string }
  brand?: { name: string }
  lowest_price: number | null
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
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ManualProduct | null>(null)
  const [matchMode, setMatchMode] = useState<'name' | 'reference'>('reference')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

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

  const searchSuggestions = async (product: ManualProduct, mode: 'name' | 'reference') => {
    setSelectedProduct(product)
    setMatchMode(mode)
    setSuggestions([])
    setSelectedMatchId(null)
    setImageUrl(product.image_url || '')
    
    let query = ''
    if (mode === 'reference' && product.reference) {
      query = product.reference
    } else if (mode === 'name' && product.name) {
      query = product.name
    }
    
    if (!query) return
    
    setLoadingSuggestions(true)
    try {
      const res = await employeeApi.get(`/employee/products?q=${encodeURIComponent(query)}&page=1`)
      const prods = res.data.data || []
      setSuggestions(prods)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedProduct) return
    
    try {
      await employeeApi.post(`/employee/manual-products/${selectedProduct.id}/approve`, {
        matched_product_id: selectedMatchId,
        image_url: selectedMatchId ? null : imageUrl,
      })
      setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, status: 'approved' } : p))
      setSelectedProduct(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleReject = async () => {
    if (!selectedProduct) return
    const reason = prompt('Raison du rejet:')
    if (!reason) return
    try {
      await employeeApi.post(`/employee/manual-products/${selectedProduct.id}/reject`, { reason })
      setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, status: 'rejected', rejection_reason: reason } : p))
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
                        onClick={() => searchSuggestions(product, 'reference')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Rechercher par référence"
                      >
                        <Link2 className="w-5 h-5" />
                      </button>
                      {product.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleApprove()}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Approuver"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleReject}
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
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          matchMode={matchMode}
          setMatchMode={setMatchMode}
          searchSuggestions={searchSuggestions}
          suggestions={suggestions}
          selectedMatchId={selectedMatchId}
          setSelectedMatchId={setSelectedMatchId}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          loadingSuggestions={loadingSuggestions}
        />
      )}
    </div>
  )
}

function ProductModal({ product, onClose, onApprove, onReject, matchMode, setMatchMode, searchSuggestions, suggestions, selectedMatchId, setSelectedMatchId, imageUrl, setImageUrl, loadingSuggestions }: any) {
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center" style={{ zIndex: 999999 }}>
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Vérifier le produit</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit</label>
            <input
              type="text"
              value={product.name}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={product.description || ''}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix</label>
              <input
                type="text"
                value={product.price ? `${product.price} DT` : '-'}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
              <input
                type="text"
                value={product.reference || '-'}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher un produit existant</label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => searchSuggestions(product, 'reference')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  matchMode === 'reference' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Par référence
              </button>
              <button
                onClick={() => searchSuggestions(product, 'name')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  matchMode === 'name' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Par nom
              </button>
            </div>
          </div>

          {loadingSuggestions ? (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
              Recherche en cours...
            </div>
          ) : suggestions.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Produits trouvés (cliquez pour sélectionner)</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {suggestions.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedMatchId(s.id)}
                    className={`w-full text-left p-2 rounded-lg border flex items-center gap-2 ${
                      selectedMatchId === s.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {s.image_url && (
                      <img src={s.image_url} alt="" className="w-8 h-8 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      {s.reference && <p className="text-xs text-gray-500">Réf: {s.reference}</p>}
                    </div>
                    {s.lowest_price && (
                      <span className="text-sm font-medium text-green-600">{s.lowest_price} DT</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">Aucun produit trouvé</p>
          )}

          {!selectedMatchId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Image className="w-4 h-4" /> URL de l'image (pour créer nouveau produit)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e: any) => setImageUrl(e.target.value)}
                placeholder="https://exemple.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={onReject}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Rejeter
            </button>
            <button
              onClick={onApprove}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              {selectedMatchId ? 'Approuver (lier au produit)' : 'Approuver (créer nouveau)'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}