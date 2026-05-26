'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, Package, Tag, BarChart3, Bell, LogOut, Menu, Search
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
  { href: '/employee', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/employee/products', icon: Package, label: 'Produits' },
  { href: '/employee/categories', icon: Tag, label: 'Catégories' },
  { href: '/employee/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/employee/alerts', icon: Bell, label: 'Alertes Prix' },
]

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [employee, setEmployee] = useState<{ name: string; prename: string } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

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
    } else if (pathname !== '/employee/login') {
      router.push('/employee/login')
    }
  }, [router, pathname])

  const handleLogout = () => {
    localStorage.removeItem('employee_token')
    localStorage.removeItem('employee_user')
    router.push('/employee/login')
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
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/employee" className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">PT</span>
              </div>
              <span className="hidden sm:inline">PrixTunisix</span>
            </Link>
            
            {/* Top navigation */}
            <nav className="hidden lg:flex items-center gap-1 ml-6">
              {menuItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    pathname === item.href 
                      ? 'bg-brand-50 text-brand-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-brand-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
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

      <div className="flex">
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} lg:w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-56px)] transition-all overflow-hidden`}>
          <nav className="p-4 space-y-1">
            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                  pathname === item.href 
                    ? 'bg-brand-50 text-brand-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-brand-600'
                }`}
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