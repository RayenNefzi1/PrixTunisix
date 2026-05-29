'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, Users, ShoppingBag, Store, BarChart3, 
  Settings, LogOut, Menu, X, Package, Bell, Tag, CreditCard, RefreshCw, BellRing, Trash2, CheckCircle, UserCheck, FileSpreadsheet
} from 'lucide-react'
import ToastProvider from '@/components/Toast'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
}

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Utilisateurs' },
  { href: '/admin/fournisseurs', icon: Store, label: 'Fournisseurs' },
  { href: '/admin/products', icon: Package, label: 'Produits' },
  { href: '/admin/subscriptions', icon: CreditCard, label: 'Abonnements' },
  { href: '/admin/categories', icon: Tag, label: 'Catégories' },
  { href: '/admin/employees', icon: UserCheck, label: 'Employés' },
  { href: '/admin/manual-products', icon: FileSpreadsheet, label: 'Produits Manuels' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/alerts', icon: Bell, label: 'Alertes Prix' },
  { href: '/admin/scraping', icon: RefreshCw, label: 'Scraping' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<{ name: string; prename: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('admin_notifications')
    if (stored) {
      setNotifications(JSON.parse(stored))
    } else {
      setNotifications([
        { id: '1', title: 'Bienvenue', message: 'Bienvenue dans le panneau admin PrixTunisix', type: 'info', read: false, created_at: new Date().toISOString() }
      ])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('admin_notifications', JSON.stringify(notifications))
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

  if (typeof window !== 'undefined') {
    (window as any).addAdminNotification = addNotification
  }

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const stored = localStorage.getItem('admin_user')
    
    if (token && stored) {
      setAdmin(JSON.parse(stored))
    } else if (pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [router, pathname])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    router.push('/admin/login')
  }

  const isLoginPage = pathname === '/admin/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 overflow-hidden">
      <header className="bg-slate-800 text-white fixed top-0 left-0 right-0 z-[100]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-700 rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/admin" className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">PT</span>
              </div>
              <span>PrixTunisix Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-slate-700 rounded text-slate-300 hover:text-white relative"
              >
                <BellRing className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
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
                              <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <span className="text-sm text-slate-300">
              {(admin?.prename || '')[0]}{(admin?.name || '')[0]}
            </span>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} lg:w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-56px)] transition-all overflow-hidden`}>
          <nav className="p-4 space-y-1">
            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-brand-600 rounded-lg transition"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-6">
          <ToastProvider>
            {children}
          </ToastProvider>
        </main>
      </div>
    </div>
  )
}