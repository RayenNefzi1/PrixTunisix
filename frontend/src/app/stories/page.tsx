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
    product_name: 'MacBook Air M3 13" - 8GB RAM 256GB SSD',
    product_slug: 'macbook-air-13-m3',
    product_image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    category_code: '1',
    merchant_name: 'Tunisianet',
    current_price: 2699,
    original_price: 3199,
    discount_percentage: 16,
  },
  {
    id: 2,
    product_name: 'iPhone 15 Pro Max 256GB Titane',
    product_slug: 'iphone-15-pro-max',
    product_image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
    category_code: '4',
    merchant_name: 'Tunisianet',
    current_price: 3299,
    original_price: 3799,
    discount_percentage: 13,
  },
  {
    id: 3,
    product_name: 'Samsung Galaxy S24 Ultra 256GB',
    product_slug: 'samsung-galaxy-s24-ultra',
    product_image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
    category_code: '4',
    merchant_name: 'Tunisianet',
    current_price: 2899,
    original_price: 3499,
    discount_percentage: 17,
  },
  {
    id: 4,
    product_name: 'PC Portable HP Pavilion 15" Intel Core i7',
    product_slug: 'hp-pavilion-15',
    product_image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    category_code: '1',
    merchant_name: 'Tunisianet',
    current_price: 1299,
    original_price: 1599,
    discount_percentage: 19,
  },
  {
    id: 5,
    product_name: 'Sony WH-1000XM5 Casque Audio Premium',
    product_slug: 'sony-wh-1000xm5',
    product_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    category_code: '1_8',
    merchant_name: 'Tunisianet',
    current_price: 599,
    original_price: 799,
    discount_percentage: 25,
  },
  {
    id: 6,
    product_name: 'LG TV OLED 55" 4K Smart WebOS',
    product_slug: 'lg-oled-55',
    product_image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80',
    category_code: '1_7',
    merchant_name: 'Tunisianet',
    current_price: 2199,
    original_price: 2999,
    discount_percentage: 27,
  },
  {
    id: 7,
    product_name: 'Apple Watch Series 9 GPS 45mm',
    product_slug: 'apple-watch-series-9',
    product_image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=80',
    category_code: '4_6',
    merchant_name: 'Tunisianet',
    current_price: 899,
    original_price: 1099,
    discount_percentage: 18,
  },
  {
    id: 8,
    product_name: 'Dell XPS 15 Intel Core i7 32GB',
    product_slug: 'dell-xps-15',
    product_image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
    category_code: '1',
    merchant_name: 'Tunisianet',
    current_price: 2499,
    original_price: 3199,
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
            {/* Background image with zoom effect */}
            <div className={`absolute inset-0 transition-transform duration-500 ${isPaused ? 'scale-105' : 'scale-100'}`}>
              <Image
                src={currentOffer.product_image}
                alt={currentOffer.product_name}
                fill
                className="object-cover"
                priority
              />
            </div>
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/95" />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />

            {/* Header with icon */}
            <div className="absolute top-14 left-4 right-4 flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500 rounded-full shadow-lg shadow-red-500/30">
                <TrendingDown className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-sm">BEST DEAL</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-medium text-sm">🔥 En stock</span>
              </div>
            </div>

            {/* Product info */}
            <div className="absolute bottom-32 left-4 right-4">
              {/* Animated price tag */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 rounded-lg mb-3 animate-bounce">
                <Tag className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-xl">-{currentOffer.discount_percentage}%</span>
              </div>
              
              <h2 className="text-white text-2xl font-bold mb-3 line-clamp-3 leading-tight drop-shadow-lg">
                {currentOffer.product_name}
              </h2>
              
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-5xl font-black text-white drop-shadow-xl">{currentOffer.current_price} DT</span>
                <span className="text-xl text-white/50 line-through drop-shadow">{currentOffer.original_price} DT</span>
              </div>
            </div>

            {/* Actions */}
            <div className="absolute bottom-6 left-4 right-4 flex gap-3">
              <Link
                href={`/produits/${currentOffer.category_code}/${currentOffer.product_slug}`}
                className="flex-1 py-4 bg-white text-black font-bold text-center rounded-xl hover:bg-gray-100 transition hover:scale-105 active:scale-95 text-base shadow-lg"
              >
                Voir le prix
              </Link>
              <Link
                href={`/produits/${currentOffer.category_code}/${currentOffer.product_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-4 px-6 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-brand-600/30"
              >
                Acheter
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

      {/* Navigation arrows */}
      <button 
        onClick={handlePrev}
        className="absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition hover:scale-110 z-20"
      >
        <ChevronLeft className="w-8 h-8 text-white" />
      </button>
      <button 
        onClick={handleNext}
        className="absolute right-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition hover:scale-110 z-20"
      >
        <ChevronRight className="w-8 h-8 text-white" />
      </button>

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