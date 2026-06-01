'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Tag, Sparkles, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface StoryOffer {
  id: number
  product_name: string
  product_slug: string
  product_image: string
  category_code: string
  merchant_name: string
  current_price: number
  original_price: number
  discount_percentage: number
}

const mockOffers: StoryOffer[] = [
  {
    id: 1,
    product_name: 'Sacoche Dell EcoLoop Essential 14"-16"',
    product_slug: 'sacoche-dell-ecoloop-essential-14-16-cc3624',
    product_image: 'https://www.tunisianet.com.tn/415896-home/sacoche-dell-ecoloop-essential-14-16.jpg',
    category_code: '1',
    merchant_name: 'Tunisianet',
    current_price: 89,
    original_price: 120,
    discount_percentage: 26,
  },
  {
    id: 2,
    product_name: 'Carte mémoire SDXC Express Patriot 1To',
    product_slug: 'carte-m%C3%A9moire-sdxc-express-v30-uhs-i-u3-4k-uhd-patriot-ep-1-to-pef1tepexmcx',
    product_image: 'https://www.tunisianet.com.tn/447349-home/carte-memoire-sdxc-express-v30-uhs-i-u3-4k-uhd-patriot-ep-1-to.jpg',
    category_code: '1',
    merchant_name: 'Tunisianet',
    current_price: 959,
    original_price: 1299,
    discount_percentage: 26,
  },
  {
    id: 3,
    product_name: 'Bobine YDD 50X CD-R 700MB',
    product_slug: 'bobine-ydd-50x-cd-r-700-mb-80-min-imprimable-cd-ydd-imp',
    product_image: 'https://www.tunisianet.com.tn/416548-home/bobine-ydd-50x-cd-r-700-mb-80-min-imprimable.jpg',
    category_code: '1',
    merchant_name: 'Tunisianet',
    current_price: 30.9,
    original_price: 45,
    discount_percentage: 31,
  },
  {
    id: 4,
    product_name: 'Protecteur écran Samsung S23+',
    product_slug: 'protecteur-d%C3%A9cran-anti-lumi%C3%A8re-bleue-screenforce-curve-pour-samsung-s23-ovb035zz',
    product_image: 'https://www.tunisianet.com.tn/427739-home/protecteur-d-ecran-anti-lumiere-bleue-screenforce-curve-pour-samsung-s23.jpg',
    category_code: '1',
    merchant_name: 'Tunisianet',
    current_price: 35,
    original_price: 49,
    discount_percentage: 29,
  },
  {
    id: 5,
    product_name: 'Tablette XP-PEN Artist Pro 24',
    product_slug: 'tablette-graphique-xp-pen-artist-pro-24-gen-2-165-hz-noir-artist-pro-24-gen2',
    product_image: 'https://www.tunisianet.com.tn/460739-home/tablette-graphique-xp-pen-artist-pro-24-gen-2-165-hz-noir.jpg',
    category_code: '1',
    merchant_name: 'Tunisianet',
    current_price: 4159,
    original_price: 5499,
    discount_percentage: 24,
  },
  {
    id: 6,
    product_name: 'Serveur HP ProLiant DL380 Gen10',
    product_slug: 'serveur-rack-hpe-proliant-dl380-gen10-intel-xeon-2x-gold-521864-go-sans-disques-p56964-b21',
    product_image: 'https://www.tunisianet.com.tn/341585-home/serveur-rack-hpe-proliant-dl380-gen10-intel-xeon-2x-gold-521864-go-sans-disques.jpg',
    category_code: '1',
    merchant_name: 'Tunisianet',
    current_price: 24955,
    original_price: 32999,
    discount_percentage: 24,
  },
  {
    id: 7,
    product_name: 'Serveur HP ProLiant DL380 Gen10 Plus',
    product_slug: 'serveur-rack-hpe-proliant-dl380-gen10-plus-intel-xeon-silver-4314-32-go-sans-disques-p55247-b21',
    product_image: 'https://www.tunisianet.com.tn/341638-home/serveur-rack-hpe-proliant-dl380-gen10-plus-intel-xeon-silver-4314-32-go-sans-disques.jpg',
    category_code: '1',
    merchant_name: 'Tunisianet',
    current_price: 23775,
    original_price: 29999,
    discount_percentage: 21,
  },
  {
    id: 8,
    product_name: 'Serveur Dell PowerEdge R750XS',
    product_slug: 'serveur-dell-poweredge-r750xs-dual-intel-xeon-gold-4310-4x-16-go-12-to-361843-r750',
    product_image: 'https://www.tunisianet.com.tn/368546-home/serveur-dell-poweredge-r750xs-dual-intel-xeon-gold-4310-4x-16-go-12-to.jpg',
    category_code: '1',
    merchant_name: 'Tunisianet',
    current_price: 23279,
    original_price: 29999,
    discount_percentage: 22,
  }
]

export default function StoriesPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isPaused && !isAnimating) {
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNext()
            return 0
          }
          return prev + 2
        })
      }, 100)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPaused, currentIndex, isAnimating])

  const handleNext = () => {
    if (isAnimating) return
    setDirection('right')
    setIsAnimating(true)
    setProgress(0)
    setTimeout(() => {
      setCurrentIndex(prev => (prev < mockOffers.length - 1 ? prev + 1 : 0))
      setIsAnimating(false)
    }, 300)
  }

  const handlePrev = () => {
    if (isAnimating) return
    setDirection('left')
    setIsAnimating(true)
    setProgress(0)
    setTimeout(() => {
      setCurrentIndex(prev => (prev > 0 ? prev - 1 : mockOffers.length - 1))
      setIsAnimating(false)
    }, 300)
  }

  const getPrevIndex = () => currentIndex > 0 ? currentIndex - 1 : mockOffers.length - 1
  const getNextIndex = () => currentIndex < mockOffers.length - 1 ? currentIndex + 1 : 0

  const currentOffer = mockOffers[currentIndex]
  const prevOffer = mockOffers[getPrevIndex()]
  const nextOffer = mockOffers[getNextIndex()]

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Close button */}
      <Link href="/" className="absolute top-4 right-4 z-50 p-3 bg-white/10 rounded-full hover:bg-white/20 transition hover:scale-110">
        <X className="w-6 h-6 text-white" />
      </Link>

      {/* Main container with prev/next visible */}
      <div className="relative flex items-center gap-0">
        {/* Previous story preview */}
        <div 
          className="hidden md:block relative w-48 h-[75vh] cursor-pointer opacity-30 hover:opacity-60 transition-all duration-300 rounded-l-3xl overflow-hidden scale-95"
          onClick={handlePrev}
        >
          <Image
            src={prevOffer.product_image}
            alt={prevOffer.product_name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ChevronLeft className="w-10 h-10 text-white/50" />
          </div>
        </div>

        {/* Current story */}
        <div 
          className={`relative w-[420px] h-[75vh] bg-black rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-800 transition-all duration-300 ${
            isAnimating 
              ? direction === 'right' 
                ? 'translate-x-[-100px] opacity-0 scale-95' 
                : 'translate-x-[100px] opacity-0 scale-95'
              : 'translate-x-0 opacity-100 scale-100'
          }`}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600/20 via-transparent to-brand-600/20 pointer-events-none" />
          
          {/* Progress bars */}
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
            {mockOffers.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{ 
                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Story content */}
          <div className="relative h-full">
            {/* Background image with zoom and blur effect */}
            <div className={`absolute inset-0 transition-all duration-700 ${isPaused ? 'scale-110 blur-sm' : 'scale-100 blur-0'}`}>
              <Image
                src={currentOffer.product_image}
                alt={currentOffer.product_name}
                fill
                className="object-cover object-center"
                priority
              />
            </div>
            
            {/* Beautiful gradient overlay with vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-brand-900/60 via-black/30 to-black/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-900/40 via-transparent to-brand-900/40" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />

            {/* Header with icon */}
            <div className="absolute top-14 left-4 right-4 flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg shadow-red-500/50">
                <TrendingDown className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-sm">BEST DEAL</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-2 bg-white/30 backdrop-blur-md rounded-full">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-white font-medium text-sm">🔥 En stock</span>
              </div>
            </div>

            {/* Product info */}
            <div className="absolute bottom-32 left-4 right-4">
              {/* Animated price tag */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg mb-3 shadow-lg shadow-red-500/50 animate-bounce">
                <Tag className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-xl">-{currentOffer.discount_percentage}%</span>
              </div>
              
              <h2 className="text-white text-2xl font-bold mb-3 line-clamp-3 leading-tight drop-shadow-lg text-shadow-md">
                {currentOffer.product_name}
              </h2>
              
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-5xl font-black text-white drop-shadow-xl">{currentOffer.current_price} DT</span>
                <span className="text-xl text-white/50 line-through drop-shadow">{currentOffer.original_price} DT</span>
              </div>
            </div>

            {/* Actions */}
            <div className="absolute bottom-6 left-4 right-4">
              <Link
                href={`/produits/${currentOffer.category_code}/${currentOffer.product_slug}`}
                className="block w-full py-4 bg-white text-black font-bold text-center rounded-xl hover:bg-gray-100 transition hover:scale-105 active:scale-95 text-base shadow-lg"
              >
                Voir le prix
              </Link>
            </div>
          </div>
        </div>

        {/* Next story preview */}
        <div 
          className="hidden md:block relative w-48 h-[75vh] cursor-pointer opacity-30 hover:opacity-60 transition-all duration-300 rounded-r-3xl overflow-hidden scale-95"
          onClick={handleNext}
        >
          <Image
            src={nextOffer.product_image}
            alt={nextOffer.product_name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ChevronRight className="w-10 h-10 text-white/50" />
          </div>
        </div>
      </div>

      {/* Swipe hint */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2">
        <p className="text-white/40 text-sm">← Cliquez pour naviguer →</p>
        <div className="flex gap-1">
          {mockOffers.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-8 bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}