'use client'

import { useEffect, useState } from 'react'
import { Ticket, Copy, Check, Tag, Lock, Store } from 'lucide-react'
import Link from 'next/link'
import Cookies from 'js-cookie'
import Image from 'next/image'

interface Product {
  id: number
  name: string
  slug: string
  image_url: string | null
  category: {
    code: string | null
    slug: string | null
  } | null
}

interface Offer {
  id: number
  product: Product
  merchant_website: {
    id: number
    name: string
    logo_url: string | null
  } | null
}

interface Coupon {
  id: number
  code: string
  description: string
  discount_value: string
  discount_type: string
  min_order_amount: string | null
  valid_until: string
  offer: Offer | null
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchCoupons()
  }, [])

  const checkAuth = () => {
    const token = Cookies.get('auth_token')
    const stored = localStorage.getItem('user')
    setIsAuthenticated(!!token && !!stored)
  }

  const fetchCoupons = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coupons`)
      const data = await response.json()
      setCoupons(data)
    } catch (error) {
      console.error('Failed to fetch coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="w-20 h-20 bg-gray-200 rounded-2xl mx-auto mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-6">
          <Lock className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Coupons & Promotions</h1>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          Connectez-vous pour accéder aux codes promo et réductions exclusives de vos marchands préférés!
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  if (coupons.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-50 rounded-2xl mb-6">
          <Ticket className="w-10 h-10 text-brand-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Coupons & Promotions</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Aucun coupon disponible pour le moment. Revenez plus tard!
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-50 rounded-2xl mb-6">
          <Ticket className="w-10 h-10 text-brand-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Coupons & Promotions</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Ces codes promo sont valables uniquement pour les produits spécifiés. Copiez le code et utilisez-le lors de votre achat chez le marchand.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-brand-600" />
                  <span className="text-lg font-bold text-gray-900">{coupon.code}</span>
                </div>
                <span className="text-2xl font-bold text-brand-600">
                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} DT`}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4">{coupon.description}</p>

              {coupon.min_order_amount && (
                <p className="text-xs text-gray-500 mb-4">
                  Minimum commande: {coupon.min_order_amount} DT
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Expire: {formatDate(coupon.valid_until)}
                </span>
                <button
                  onClick={() => copyToClipboard(coupon.code)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium hover:bg-brand-100 transition"
                >
                  {copied === coupon.code ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copié!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copier
                    </>
                  )}
                </button>
              </div>
            </div>

            {coupon.offer && coupon.offer.product && (
              <div className="bg-gray-50 p-4 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  Valable pour ce produit:
                </p>
                <Link
                  href={`/produits/${coupon.offer.product.category?.code || 'default'}/${coupon.offer.product.slug}`}
                  className="flex items-center gap-3 p-2 bg-white rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                    {coupon.offer.product.image_url ? (
                      <Image
                        src={coupon.offer.product.image_url}
                        alt={coupon.offer.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        IMG
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {coupon.offer.product.name}
                    </p>
                    {coupon.offer.merchant_website && (
                      <p className="text-xs text-gray-500">
                        chez {coupon.offer.merchant_website.name}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            )}

            {!coupon.offer && (
              <div className="bg-brand-50 p-4 border-t border-gray-200">
                <p className="text-xs font-medium text-brand-700">
                  💡 Ce coupon est valide pour tous les produits du marchand partenaire
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-gray-500 text-sm mt-8">
        * Les conditions générales s'appliquent. Utilisez ces codes directement sur le site du marchand.
      </p>
    </div>
  )
}