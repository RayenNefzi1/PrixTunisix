'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import adminApi from '@/lib/admin-api'
import { Users, Store, Package, TrendingUp, Bell, ShoppingBag, Tag, Shield } from 'lucide-react'

interface Stats {
  total_users: number
  total_fournisseurs: number
  total_products: number
  total_offers: number
  active_alerts: number
  total_categories: number
  total_brands: number
  total_merchants: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.get('/admin/dashboard')
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
          <Shield className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">Dashboard Administrateur</h1>
          <p className="text-brand-200 text-sm mt-0.5">Vue d'ensemble de la plateforme</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Utilisateurs', value: stats?.total_users ?? 0, icon: <Users className="w-5 h-5 text-blue-500" /> },
          { label: 'Fournisseurs', value: stats?.total_fournisseurs ?? 0, icon: <Store className="w-5 h-5 text-purple-500" /> },
          { label: 'Produits', value: stats?.total_products ?? 0, icon: <Package className="w-5 h-5 text-green-500" /> },
          { label: 'Offres', value: stats?.total_offers ?? 0, icon: <ShoppingBag className="w-5 h-5 text-orange-500" /> },
          { label: 'Catégories', value: stats?.total_categories ?? 0, icon: <Tag className="w-5 h-5 text-yellow-500" /> },
          { label: 'Marques', value: stats?.total_brands ?? 0, icon: <Bell className="w-5 h-5 text-red-500" /> },
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
          <Link href="/admin/alerts" className="text-brand-600 hover:underline text-sm font-medium">
            Voir toutes →
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/users" className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition">
          <Users className="w-4 h-4" /> Utilisateurs
        </Link>
        <Link href="/admin/fournisseurs" className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
          <Store className="w-4 h-4" /> Fournisseurs
        </Link>
        <Link href="/admin/products" className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
          <Package className="w-4 h-4" /> Produits
        </Link>
        <Link href="/admin/scraping" className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
          <TrendingUp className="w-4 h-4" /> Scraping
        </Link>
        <Link href="/admin/analytics" className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
          <TrendingUp className="w-4 h-4" /> Analytics
        </Link>
      </div>
    </div>
  )
}