'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, Package, Tag, BarChart3, Bell, LogOut, Search, X, Image, Edit, Trash2, FileSpreadsheet
} from 'lucide-react'
import ToastProvider from '@/components/Toast'
import employeeApi from '@/lib/employee-api'
import ManualProductsView from './ManualProductsView'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
}

type View = 'dashboard' | 'products' | 'categories' | 'analytics' | 'alerts' | 'manual-products'

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'products', icon: Package, label: 'Produits' },
  { id: 'categories', icon: Tag, label: 'Catégories' },
  { id: 'manual-products', icon: FileSpreadsheet, label: 'Produits Manuels' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'alerts', icon: Bell, label: 'Alertes Prix' },
]

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  console.log('EmployeeLayout rendered')
  const router = useRouter()
  const pathname = usePathname()
  const [employee, setEmployee] = useState<{ name: string; prename: string } | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [currentView, setCurrentView] = useState<View>('dashboard')

  useEffect(() => {
    const stored = localStorage.getItem('employee_notifications')
    if (stored) {
      setNotifications(JSON.parse(stored))
    } else {
      setNotifications([
        { id: '1', title: 'Bienvenue', message: 'Bienvenue dans votre espace employé', type: 'info', read: false, created_at: new Date().toISOString() }
      ])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('employee_notifications', JSON.stringify(notifications))
  }, [notifications])

  const unreadCount = notifications.filter(n => !n.read).length

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString()
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  useEffect(() => {
    const token = localStorage.getItem('employee_token')
    const stored = localStorage.getItem('employee_user')
    
    if (token && stored) {
      setEmployee(JSON.parse(stored))
      
      employeeApi.get('/employee/manual-products/pending-count')
        .then(res => {
          if (res.data.count > 0) {
            addNotification(
              'Produits manuels en attente',
              `${res.data.count} produit(s) en attente de validation`,
              'warning'
            )
          }
        })
        .catch(console.error)
    } else if (pathname !== '/employee/login') {
      router.push('/employee/login')
    }
  }, [router, pathname])

  const handleLogout = () => {
    localStorage.removeItem('employee_token')
    localStorage.removeItem('employee_user')
    router.push('/employee/login')
  }

  const handleNavClick = (id: string) => {
    console.log('Nav click:', id)
    setCurrentView(id as View)
    // Don't close sidebar on mobile when navigating
    console.log('Current view set to:', id)
  }

  const isLoginPage = pathname === '/employee/login'

  if (isLoginPage) {
    return <ToastProvider>{children}</ToastProvider>
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (typeof window !== 'undefined') {
    (window as any).addEmployeeNotification = addNotification
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/employee" className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">PT</span>
              </div>
              <span className="hidden sm:inline">PrixTunisix</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-brand-600 relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-bold text-gray-900">Notifications</span>
                    <div className="flex gap-2">
                      <button onClick={markAllAsRead} className="text-xs text-brand-600 hover:underline">Tout lire</button>
                      <button onClick={clearNotifications} className="text-xs text-gray-500 hover:underline">Effacer</button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">Aucune notification</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => markAsRead(n.id)}
                          className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${n.type === 'success' ? 'bg-green-500' : n.type === 'error' ? 'bg-red-500' : n.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">{n.title}</p>
                              <p className="text-xs text-gray-500">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <span className="text-sm text-gray-600">
              {(employee?.prename || '')[0]}{(employee?.name || '')[0]}
            </span>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-56px)] flex-shrink-0">
          <nav className="p-4 space-y-1">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                  currentView === item.id 
                    ? 'bg-brand-50 text-brand-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-brand-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-visible min-h-0">
          <ToastProvider>
            {currentView === 'dashboard' && <DashboardView />}
            {currentView === 'products' && <ProductsView />}
            {currentView === 'categories' && <CategoriesView />}
            {currentView === 'manual-products' && <ManualProductsView />}
            {currentView === 'analytics' && <AnalyticsView />}
            {currentView === 'alerts' && <AlertsView />}
          </ToastProvider>
        </main>
      </div>
    </div>
  )
}

function DashboardView() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('employee_token')
    console.log('Employee token:', token ? 'exists' : 'missing')
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')
    
    employeeApi.get('/employee/dashboard')
      .then(res => {
        console.log('Dashboard response:', res.data)
        setStats(res.data)
      })
      .catch(err => {
        console.error('Dashboard error:', err)
        setError(err.message || 'Failed to load')
      })
      .finally(() => setLoading(false))
  }, [])

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
          <p className="font-medium">Erreur de chargement</p>
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-2">Vérifiez que le serveur backend est en cours d'exécution</p>
        </div>
      </div>
    )
  }

  const categoryData = stats?.products_by_category || []
  const totalProducts = stats?.total_products || 1

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl text-white">
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
          <LayoutDashboard className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">Dashboard Employé</h1>
          <p className="text-brand-200 text-sm mt-0.5">Gérez les produits et analysez les données</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Produits', value: stats?.total_products ?? 0, icon: <Package className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
          { label: 'Catégories', value: stats?.total_categories ?? 0, icon: <Tag className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50' },
          { label: 'Marques', value: stats?.total_brands ?? 0, icon: <Tag className="w-5 h-5 text-orange-500" />, bg: 'bg-orange-50' },
          { label: 'Alertes', value: stats?.active_alerts ?? 0, icon: <Bell className="w-5 h-5 text-red-500" />, bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{s.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart - Products by Category */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Produits par catégorie</h2>
          {categoryData.length > 0 ? (
            <div className="flex items-center gap-6">
              {/* Pie Chart Visual */}
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                  {categoryData.reduce((acc, cat, i) => {
                    const pct = cat.count / totalProducts
                    const offset = acc.offset
                    acc.elements.push(
                      <circle
                        key={i}
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="transparent"
                        stroke={chartColors[i % chartColors.length]}
                        strokeWidth="3"
                        strokeDasharray={`${pct * 100} ${100 - pct * 100}`}
                        strokeDashoffset={-offset}
                      />
                    )
                    acc.offset += pct * 100
                    return acc
                  }, { offset: 0, elements: [] }).elements}
                </svg>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-2">
                {categoryData.map((cat: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                      <span className="text-gray-600">{cat.name}</span>
                    </div>
                    <span className="font-medium">{cat.count} ({cat.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
          )}
        </div>

        {/* Top Brands */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Top Marques</h2>
          {stats?.top_brands?.length > 0 ? (
            <div className="space-y-3">
              {stats.top_brands.map((brand: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-gray-700">{brand.name}</span>
                  <span className="text-sm font-medium text-brand-600">{brand.count} produits</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
          )}
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Produits récents</h2>
        {stats?.recent_products?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produit</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Catégorie</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Marque</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ajouté</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recent_products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.category || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.brand || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(product.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Aucun produit récent</p>
        )}
      </div>
    </div>
  )
}

import ProductsList from './ProductsList'

function ProductsView() {
  return <ProductsList />
}

function CategoriesView() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    employeeApi.get('/employee/categories')
      .then(res => {
        console.log('Categories response:', res.data)
        setCategories(res.data.data || res.data || [])
      })
      .catch(err => console.error('Categories error:', err))
      .finally(() => setLoading(false))
  }, [])

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
        <p className="text-gray-500">Visualisez les catégories de produits</p>
      </div>

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
              {category.children && category.children.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {category.children.slice(0, 3).map((child: any) => (
                    <span key={child.id} className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                      {child.name}
                    </span>
                  ))}
                  {category.children.length > 3 && (
                    <span className="text-xs text-gray-400">+{category.children.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AnalyticsView() {
  const [analytics, setAnalytics] = useState<any>(null)
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Clics aujourd'hui", value: analytics?.clicks_today ?? 0, icon: <Package className="w-5 h-5 text-blue-500" /> },
          { label: 'Clics ce mois', value: analytics?.clicks_this_month ?? 0, icon: <Tag className="w-5 h-5 text-green-500" /> },
          { label: 'Clics total', value: analytics?.total_clicks ?? 0, icon: <BarChart3 className="w-5 h-5 text-orange-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
            <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Top Produits</h2>
          <div className="space-y-3">
            {analytics?.top_products?.slice(0, 5).map((product: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-gray-700 truncate">{product.name}</span>
                <span className="font-medium text-brand-600">{product.clicks} clics</span>
              </div>
            )) || <p className="text-gray-500">Aucune donnée</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Top Marchands</h2>
          <div className="space-y-3">
            {analytics?.top_merchants?.slice(0, 5).map((merchant: any, i: number) => (
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

function AlertsView() {
  const [alerts, setAlerts] = useState<any[]>([])
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
                  <Bell className="w-6 h-6 text-yellow-600" />
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
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(alert.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}