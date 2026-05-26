'use client'

import { useEffect, useState } from 'react'
import employeeApi from '@/lib/employee-api'
import { BarChart3, TrendingUp, MousePointer, Eye, Calendar } from 'lucide-react'

interface ClickData {
  date: string
  clicks: number
}

interface Analytics {
  total_clicks: number
  clicks_this_month: number
  clicks_today: number
  clicks_by_day: ClickData[]
  top_products: { name: string; clicks: number }[]
  top_merchants: { name: string; clicks: number }[]
}

export default function EmployeeAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    employeeApi.get('/employee/analytics/clicks')
      .then(res => setAnalytics(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500">Analysez les performances de la plateforme</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Clics aujourd'hui", value: analytics?.clicks_today ?? 0, icon: <MousePointer className="w-5 h-5 text-blue-500" /> },
          { label: 'Clics ce mois', value: analytics?.clicks_this_month ?? 0, icon: <TrendingUp className="w-5 h-5 text-green-500" /> },
          { label: 'Clics total', value: analytics?.total_clicks ?? 0, icon: <BarChart3 className="w-5 h-5 text-orange-500" /> },
          { label: 'Jours de données', value: analytics?.clicks_by_day?.length ?? 0, icon: <Calendar className="w-5 h-5 text-purple-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
            <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Clics par jour (30 derniers jours)</h2>
        <div className="h-48 flex items-end gap-1">
          {analytics?.clicks_by_day?.slice(-14).map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className="w-full bg-brand-500 rounded-t"
                style={{ height: `${Math.min(100, (day.clicks / (analytics?.clicks_this_month || 1)) * 100)}%` }}
              />
              <span className="text-[10px] text-gray-400">{new Date(day.date).getDate()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Top Produits</h2>
          <div className="space-y-3">
            {analytics?.top_products?.slice(0, 5).map((product, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-gray-700">{product.name}</span>
                <span className="font-medium text-brand-600">{product.clicks} clics</span>
              </div>
            )) || <p className="text-gray-500">Aucune donnée</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Top Marchands</h2>
          <div className="space-y-3">
            {analytics?.top_merchants?.slice(0, 5).map((merchant, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-gray-700">{merchant.name}</span>
                <span className="font-medium text-brand-600">{merchant.clicks} clics</span>
              </div>
            )) || <p className="text-gray-500">Aucune donnée</p>}
          </div>
        </div>
      </div>
    </div>
  )
}