'use client'

import { useEffect, useState } from 'react'
import employeeApi from '@/lib/employee-api'
import { Search, Tag, Edit, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: number
  name: string
  slug: string
  code: string | null
  products_count: number
  image: string | null
}

export default function EmployeeCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    employeeApi.get('/employee/categories')
      .then(res => setCategories(res.data.data || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
        <p className="text-gray-500">Visualisez les catégories de produits</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une catégorie..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl"
        />
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map(category => (
            <div
              key={category.id}
              className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                  ) : (
                    <Tag className="w-6 h-6 text-brand-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.products_count} produits</p>
                </div>
              </div>
              {category.code && (
                <div className="mt-3 inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                  {category.code}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredCategories.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          Aucune catégorie trouvée
        </div>
      )}
    </div>
  )
}