'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import adminApi from '@/lib/admin-api'
import { Users, Store, Package, Bell, ShoppingBag, Tag, Shield } from 'lucide-react'

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
  const [fournisseurStats, setFournisseurStats] = useState<any>(null)
  const [categoryStats, setCategoryStats] = useState<any>(null)

  useEffect(() => {
    adminApi.get('/admin/dashboard')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
    
    adminApi.get('/admin/fournisseurs')
      .then(res => {
        const data = res.data.data || res.data || []
        const plans = data.reduce((acc: any, f: any) => {
          const plan = f.subscription?.plan || 'pro'
          acc[plan] = (acc[plan] || 0) + 1
          return acc
        }, {})
        setFournisseurStats(plans)
      })
      .catch(console.error)
    
    adminApi.get('/categories')
      .then(res => {
        const cats = res.data || []
        const data = Array.isArray(cats) ? cats : (cats.data || [])
        setCategoryStats({
          total: data.length,
          categories: data.reduce((acc: any, c: any) => {
            acc[c.name] = 1
            return acc
          }, {} as Record<string, number>)
        })
      })
      .catch(console.error)
  }, [])

  const fournisseurColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
  const categoryColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

  const fournisseurPlanLabels: Record<string, string> = {
    pro: 'Pro', 
    max: 'Max',
    premium_manual: 'Premium Manuel'
  }

  // Build conic gradient with proper percentages
  const buildGradient = (stats: Record<string, number>, colors: string[]) => {
    const entries = Object.entries(stats).filter(([_, v]) => v > 0)
    if (entries.length === 0) return 'none'
    
    const total = entries.reduce((sum, [_, v]) => sum + v, 0)
    let gradient = ''
    let current = 0
    
    entries.forEach(([_, count], i) => {
      const percent = (count / total) * 100
      const next = current + percent
      gradient += `${colors[i % colors.length]} ${current}% ${next}%${i < entries.length - 1 ? ',' : ''}`
      current = next
    })
    
    return `conic-gradient(${gradient})`
  }

  const fournisseurGradient = buildGradient(fournisseurStats || {}, fournisseurColors)
  const categoryGradient = buildGradient(categoryStats?.categories || {}, categoryColors)

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  const totalFournisseur = Object.values(fournisseurStats || {}).reduce((a: any, b: any) => a + (b || 0), 0) as number
  const totalCategory = categoryStats?.total || 0

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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
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

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fournisseur by Plan */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Fournisseurs par plan</h2>
          {totalFournisseur === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-40 h-40 rounded-full flex items-center justify-center" style={{ background: fournisseurGradient }}>
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">{totalFournisseur}</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {Object.entries(fournisseurStats || {}).map(([plan, count]: [string, any], i: number) => (
                  <div key={plan} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fournisseurColors[i % fournisseurColors.length] }} />
                      <span className="text-sm text-gray-600">{fournisseurPlanLabels[plan] || plan}</span>
                    </div>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Catégories</h2>
          {totalCategory === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-40 h-40 rounded-full flex items-center justify-center" style={{ background: categoryGradient }}>
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">{totalCategory}</span>
                </div>
              </div>
              <div className="flex-1 space-y-2 max-h-40 overflow-y-auto">
                {Object.keys(categoryStats?.categories || {}).slice(0, 8).map((name: string, i: number) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[i % categoryColors.length] }} />
                      <span className="text-sm text-gray-600 truncate max-w-[120px]">{name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}