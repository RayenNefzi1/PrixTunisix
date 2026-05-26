'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import employeeApi from '@/lib/employee-api'
import { Package, Tag, BarChart3, Bell, TrendingUp, Eye, MousePointer, AlertCircle } from 'lucide-react'

interface Stats {
  total_products: number
  total_categories: number
  total_brands: number
  active_alerts: number
  clicks_this_month: number
  views_this_month: number
}

export default function EmployeeDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    employeeApi.get('/employee/dashboard')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 p-6 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl text-white">
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">Dashboard Employé</h1>
          <p className="text-brand-200 text-sm mt-0.5">Gérez les produits et analysez les données</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Produits', value: stats?.total_products ?? 0, icon: <Package className="w-5 h-5 text-green-500" /> },
          { label: 'Catégories', value: stats?.total_categories ?? 0, icon: <Tag className="w-5 h-5 text-purple-500" /> },
          { label: 'Marques', value: stats?.total_brands ?? 0, icon: <Tag className="w-5 h-5 text-orange-500" /> },
          { label: 'Alertes', value: stats?.active_alerts ?? 0, icon: <AlertCircle className="w-5 h-5 text-red-500" /> },
          { label: 'Vues ce mois', value: stats?.views_this_month ?? 0, icon: <Eye className="w-5 h-5 text-blue-500" /> },
          { label: 'Clics ce mois', value: stats?.clicks_this_month ?? 0, icon: <MousePointer className="w-5 h-5 text-yellow-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
            <p className="text-2xl font-extrabold text-gray-900">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Alerts Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Alertes prix actives</p>
              <p className="text-sm text-gray-500">{stats?.active_alerts ?? 0} alertes en attente</p>
            </div>
          </div>
          <Link href="/employee/alerts" className="text-brand-600 hover:underline text-sm font-medium">
            Voir toutes →
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-3">
        <Link href="/employee/products" className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition">
          <Package className="w-4 h-4" /> Produits
        </Link>
        <Link href="/employee/categories" className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
          <Tag className="w-4 h-4" /> Catégories
        </Link>
        <Link href="/employee/analytics" className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
          <BarChart3 className="w-4 h-4" /> Analytics
        </Link>
        <Link href="/employee/alerts" className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
          <Bell className="w-4 h-4" /> Alertes
        </Link>
      </div>
    </div>
  )
}