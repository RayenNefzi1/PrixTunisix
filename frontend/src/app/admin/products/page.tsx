'use client'

import { useEffect, useState } from 'react'
import { Package, ChevronLeft, ChevronRight, Search, Edit, Trash2 } from 'lucide-react'
import adminApi from '@/lib/admin-api'

interface Product {
  id: number
  name: string
  slug: string
  image_url: string | null
  category: { name: string } | null
  brand: { name: string } | null
  is_validated: boolean
  created_at: string
  description?: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: page.toString() })
    if (search) params.append('q', search)

    adminApi.get(`/employee/products?${params}`)
      .then(res => res.data)
      .then(data => {
        setProducts(data.data || [])
        setTotalPages(data.last_page || 1)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [page, search])

  const handleDelete = async (productId: number) => {
    try {
      await adminApi.delete(`/employee/products/${productId}`)
      setProducts(products.filter(p => p.id !== productId))
    } catch (err) {
      console.error('Delete failed:', err)
    }
    setDeletingProduct(null)
  }

  const handleSaveEdit = async () => {
    if (!editingProduct) return
    try {
      await adminApi.put(`/employee/products/${editingProduct.id}`, {
        name: editingProduct.name,
        description: editingProduct.description,
      })
      setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p))
    } catch (err) {
      console.error('Update failed:', err)
    }
    setEditingProduct(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
        <p className="text-gray-500">Gérer les produits de la plateforme</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Produit</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Catégorie</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Marque</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Statut</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full animate-pulse" /></td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Aucun produit trouvé</td>
              </tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <span className="font-medium text-gray-900 truncate max-w-[200px]">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{p.category?.name || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{p.brand?.name || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.is_validated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.is_validated ? 'Validé' : 'En attente'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(p.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingProduct(p)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingProduct(p)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

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
                onClick={() => handleDelete(deletingProduct.id)}
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