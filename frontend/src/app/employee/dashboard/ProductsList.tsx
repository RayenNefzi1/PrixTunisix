'use client'

import { useEffect, useState } from 'react'
import { Search, Image, Edit, Trash2 } from 'lucide-react'
import employeeApi from '@/lib/employee-api'

export default function ProductsList() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [deletingProduct, setDeletingProduct] = useState<any>(null)

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await employeeApi.get(`/employee/products?q=${search}&page=${page}`)
      setProducts(res.data.data || [])
      setTotalPages(res.data.last_page || 1)
    } catch (err: any) {
      setError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [page])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchProducts()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleDelete = async (productId: number) => {
    try {
      await employeeApi.delete(`/employee/products/${productId}`)
      if (typeof window !== 'undefined' && (window as any).addEmployeeNotification) {
        (window as any).addEmployeeNotification('Produit supprimé', 'Le produit a été supprimé avec succès', 'success')
      }
      fetchProducts()
    } catch (err: any) {
      if (typeof window !== 'undefined' && (window as any).addEmployeeNotification) {
        (window as any).addEmployeeNotification('Erreur', err.response?.data?.message || 'Échec de la suppression', 'error')
      }
    }
  }

  const handleSaveEdit = async () => {
    if (!editingProduct) return
    try {
      await employeeApi.put(`/employee/products/${editingProduct.id}`, {
        name: editingProduct.name,
        description: editingProduct.description,
      })
      setEditingProduct(null)
      if (typeof window !== 'undefined' && (window as any).addEmployeeNotification) {
        (window as any).addEmployeeNotification('Produit mis à jour', 'Les informations ont été enregistrées', 'success')
      }
      fetchProducts()
    } catch (err: any) {
      if (typeof window !== 'undefined' && (window as any).addEmployeeNotification) {
        (window as any).addEmployeeNotification('Erreur', err.message || 'Failed to update product', 'error')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
        <p className="text-gray-500">Gérez les produits de la plateforme</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); fetchProducts() }} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700">
          Rechercher
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 min-w-[150px]">Produit</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 min-w-[70px]">Catégorie</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 min-w-[120px]">Prix</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-12">Offres</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Image className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-600 truncate">
                    {product.category?.name || '-'}
                  </td>
                  <td className="px-2 py-2 text-sm">
                    {product.offers && product.offers.length > 0 ? (
                      <div className="space-y-1">
                        {product.offers.slice(0, 2).map(offer => (
                          <button
                            key={offer.id}
                            onClick={async () => {
                              try {
                                const res = await employeeApi.get(`/offers/${offer.id}/redirect`)
                                window.open(res.data.url, '_blank')
                              } catch (err) {
                                window.open(offer.merchant_url, '_blank')
                              }
                            }}
                            className="w-full flex items-center justify-between gap-1 text-xs hover:bg-gray-50 p-1 rounded cursor-pointer"
                          >
                            <span className="text-gray-600 truncate">{offer.merchant_website?.name || 'Unknown'}</span>
                            <span className="font-medium text-green-600 whitespace-nowrap">{offer.price.toFixed(2)} TND</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-600 text-center">
                    {product.offers?.length || 0}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingProduct(product)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-4">
            <h3 className="font-bold text-lg mb-4">Modifier le produit</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded-lg ${
                page === p 
                  ? 'bg-brand-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {deletingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Confirmer la suppression</h3>
            <p className="text-gray-500 mb-6">
              Êtes-vous sûr de vouloir supprimer <br/>
              <span className="font-medium text-gray-900">"{deletingProduct.name}"</span> ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingProduct(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  await handleDelete(deletingProduct.id)
                  setDeletingProduct(null)
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}