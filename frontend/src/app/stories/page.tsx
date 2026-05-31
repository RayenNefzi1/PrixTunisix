'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Tag, Sparkles, TrendingDown } from 'lucide-react'
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            nextStory()
            return 0
          }
          return prev + 2
        })
      }, 100)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPaused, currentIndex])

  const nextStory = () => {
    if (currentIndex < mockOffers.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setProgress(0)
    } else {
      setCurrentIndex(0)
      setProgress(0)
    }
  }

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setProgress(0)
    } else {
      setCurrentIndex(mockOffers.length - 1)
      setProgress(0)
    }
  }

  const getPrevIndex = () => currentIndex > 0 ? currentIndex - 1 : mockOffers.length - 1
  const getNextIndex = () => currentIndex < mockOffers.length - 1 ? currentIndex + 1 : 0

  const currentOffer = mockOffers[currentIndex]
  const prevOffer = mockOffers[getPrevIndex()]
  const nextOffer = mockOffers[getNextIndex()]

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Close button */}
      <Link href="/" className="absolute top-4 right-4 z-50 p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
        <X className="w-6 h-6 text-white" />
      </Link>

      {/* Main container with prev/next visible */}
      <div className="relative flex items-center gap-0">
        {/* Previous story preview */}
        <div 
          className="hidden md:block relative w-48 h-[75vh] cursor-pointer opacity-30 hover:opacity-50 transition rounded-l-3xl overflow-hidden scale-95"
          onClick={prevStory}
        >
          <Image
            src={prevOffer.product_image}
            alt={prevOffer.product_name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Current story */}
        <div className="relative w-[420px] h-[75vh] bg-black rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-800">
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
          <div className="relative h-[75vh] cursor-default">
            {/* Background image */}
            <Image
              src={currentOffer.product_image}
              alt={currentOffer.product_name}
              fill
              className="object-cover"
              priority
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/95" />

            {/* Header with icon */}
            <div className="absolute top-14 left-4 right-4 flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full">
                <TrendingDown className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">BEST DEAL</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-full">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-medium text-sm">🔥 En stock</span>
              </div>
            </div>

            {/* Product info */}
            <div className="absolute bottom-32 left-4 right-4">
              <h2 className="text-white text-2xl font-bold mb-3 line-clamp-3 leading-tight">
                {currentOffer.product_name}
              </h2>
              
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-4xl font-black text-white">{currentOffer.current_price} DT</span>
                <span className="text-xl text-white/50 line-through">{currentOffer.original_price} DT</span>
              </div>
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-lg">
                <Tag className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-lg">-{currentOffer.discount_percentage}%</span>
              </div>
            </div>

            {/* Actions */}
            <div className="absolute bottom-6 left-4 right-4 flex gap-3">
              <Link
                href={`/produits/${currentOffer.category_code}/${currentOffer.product_slug}`}
                className="flex-1 py-3.5 bg-white text-black font-bold text-center rounded-xl hover:bg-gray-100 transition text-base"
              >
                Voir le prix
              </Link>
              <Link
                href={`/produits/${currentOffer.category_code}/${currentOffer.product_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 px-5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition flex items-center gap-2"
              >
                Acheter
              </Link>
            </div>
          </div>
        </div>

        {/* Next story preview */}
        <div 
          className="hidden md:block relative w-48 h-[75vh] cursor-pointer opacity-30 hover:opacity-50 transition rounded-r-3xl overflow-hidden scale-95"
          onClick={nextStory}
        >
          <Image
            src={nextOffer.product_image}
            alt={nextOffer.product_name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      </div>

      {/* Swipe hint */}
      <p className="absolute bottom-8 text-white/40 text-sm">
        ← Glissez pour voir →
      </p>
    </div>
  )
}