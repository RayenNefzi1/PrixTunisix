'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Users, ShoppingBag, Package, Tag, MousePointer } from 'lucide-react'
import adminApi from '@/lib/admin-api'

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    setLoading(true)
    adminApi.get(`/admin/analytics/clicks?from=${dateRange}`)
      .then(res => res.data)
      .then(data => setAnalytics(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dateRange])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const clicksByDay = analytics?.clicks_by_day || []
  const totalClicks = analytics?.total_clicks || 0
  const clicksToday = analytics?.clicks_today || 0
  const clicksThisMonth = analytics?.clicks_this_month || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Statistiques et performances de la plateforme</p>
        </div>
        <select
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl"
        >
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <MousePointer className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-gray-500">Clics aujourd'hui</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{clicksToday.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-5 h-5 text-green-500" />
            <span className="text-xs text-gray-500">Clics ce mois</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{clicksThisMonth.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            <span className="text-xs text-gray-500">Clics total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <span className="text-xs text-gray-500">Jours analysés</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics?.length || 0}</p>
        </div>
      </div>

      {/* Clicks Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Clics par jour</h2>
        {clicksByDay.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
        ) : (
        <div className="h-64 flex items-end gap-2">
          {clicksByDay.slice(0, 30).map((item: any, i: number) => {
            const maxClicks = Math.max(...clicksByDay.map((d: any) => d.total_clicks))
            const height = maxClicks > 0 ? (item.total_clicks / maxClicks) * 240 : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-brand-500 rounded-t hover:bg-brand-600 transition-colors"
                  style={{ height: `${Math.max(height, item.total_clicks > 0 ? 4 : 0)}px` }}
                  title={`${item.total_clicks} clics le ${item.date}`}
                />
                <span className="text-xs text-gray-400">{item.date?.slice(5) || '-'}</span>
              </div>
            )
          })}
        </div>
        )}
      </div>

      {/* Top Products & Merchants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Top Produits</h2>
          <div className="space-y-3">
            {analytics?.top_products?.slice(0, 10).map((product: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 truncate max-w-[200px]">{product.name}</span>
                </div>
                <span className="font-medium text-brand-600">{product.clicks?.toLocaleString() || 0} clics</span>
              </div>
            )) || <p className="text-gray-500 text-center py-4">Aucune donnée disponible</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Top Marchands</h2>
          <div className="space-y-3">
            {analytics?.top_merchants?.slice(0, 10).map((merchant: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-gray-700">{merchant.name}</span>
                </div>
                <span className="font-medium text-brand-600">{merchant.clicks?.toLocaleString() || 0} clics</span>
              </div>
            )) || <p className="text-gray-500 text-center py-4">Aucune donnée disponible</p>}
          </div>
        </div>
      </div>

      {/* Daily Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Détails quotidiens</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-gray-500">Date</th>
                <th className="text-right px-4 py-2 text-gray-500">Clics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clicksByDay.slice(0, 14).reverse().map((item: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{item.date}</td>
                  <td className="px-4 py-2 text-right font-medium text-brand-600">{item.total_clicks?.toLocaleString() || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}