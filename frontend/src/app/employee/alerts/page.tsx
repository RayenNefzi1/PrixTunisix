'use client'

import { useEffect, useState } from 'react'
import employeeApi from '@/lib/employee-api'
import { Bell, AlertCircle, Check, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Alert {
  id: number
  target_price: number
  created_at: string
  product: {
    id: number
    name: string
    slug: string
    image: string | null
    lowest_price: number | null
  } | null
  client: {
    id: number
    user: { name: string; prename: string } | null
  } | null
}

export default function EmployeeAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    employeeApi.get('/employee/alerts')
      .then(res => setAlerts(res.data.data || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alertes Prix</h1>
        <p className="text-gray-500">Visualisez les alertes de prix des clients</p>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune alerte de prix</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div key={alert.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {alert.product?.name || 'Produit supprimé'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Prix ciblé: <span className="font-medium text-green-600">{alert.target_price} TND</span>
                      </p>
                      {alert.product?.lowest_price && (
                        <p className="text-sm text-gray-500">
                          Prix actuel: <span className="font-medium">{alert.product.lowest_price} TND</span>
                          {alert.product.lowest_price <= alert.target_price && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                              Atteint
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(alert.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {alert.client && (
                    <p className="text-sm text-gray-500 mt-2">
                      Par: {alert.client.user?.prename} {alert.client.user?.name}
                    </p>
                  )}
                  {alert.product && (
                    <Link 
                      href={`/products/${alert.product.slug}`}
                      className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline mt-2"
                    >
                      Voir le produit <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}