'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, X, Tag, Store, ExternalLink, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface StoryOffer {
  id: number
  product_name: string
  product_slug: string
  product_image: string
  category_code: string
  merchant_name: string
  merchant_logo: string
  current_price: number
  original_price: number
  discount_percentage: number
  offer_url: string
}

const mockOffers: StoryOffer[] = [
  {
    id: 1,
    product_name: 'MacBook Air M3 13" - 8GB RAM 256GB',
    product_slug: 'macbook-air-m3-13-8gb-256gb',
    product_image: 'https://www.tunisianet.com.tn/481789-home/macbook-air-13-m3.jpg',
    category_code: '1',
    merchant_name: 'Tunisianet',
    merchant_logo: 'https://borgiphones.com/wp-content/uploads/2024/02/tunisianet-logo.png',
    current_price: 2699,
    original_price: 3199,
    discount_percentage: 16,
    offer_url: 'https://www.tunisianet.com.tn/macbook-air-tunisie/481789-macbook-air-13-m3.html'
  },
  {
    id: 2,
    product_name: 'iPhone 15 Pro Max 256GB Titane',
    product_slug: 'iphone-15-pro-max-256gb-titane',
    product_image: 'https://www.tunisianet.com.tn/467573-home/iphone-15-pro-max-titane.jpg',
    category_code: '4',
    merchant_name: 'Tunisianet',
    merchant_logo: 'https://borgiphones.com/wp-content/uploads/2024/02/tunisianet-logo.png',
    current_price: 3299,
    original_price: 3799,
    discount_percentage: 13,
    offer_url: 'https://www.tunisianet.com.tn/iphone-tunisie/467573-iphone-15-pro-max-titane.html'
  },
  {
    id: 3,
    product_name: 'Samsung Galaxy S24 Ultra 256GB',
    product_slug: 'samsung-galaxy-s24-ultra-256gb',
    product_image: 'https://www.tunisianet.com.tn/460739-home/samsung-galaxy-s24-ultra.jpg',
    category_code: '4',
    merchant_name: 'Tunisianet',
    merchant_logo: 'https://borgiphones.com/wp-content/uploads/2024/02/tunisianet-logo.png',
    current_price: 2899,
    original_price: 3499,
    discount_percentage: 17,
    offer_url: 'https://www.tunisianet.com.tn/samsung-galaxy-tunisie/460739-galaxy-s24-ultra.html'
  },
  {
    id: 4,
    product_name: 'PC Portable HP Pavilion 15" - Intel Core i7',
    product_slug: 'hp-pavilion-15-intel-core-i7',
    product_image: 'https://www.tunisianet.com.tn/415896-home/hp-pavilion-15.jpg',
    category_code: '1',
    merchant_name: 'Tunisianet',
    merchant_logo: 'https://borgiphones.com/wp-content/uploads/2024/02/tunisianet-logo.png',
    current_price: 1299,
    original_price: 1599,
    discount_percentage: 19,
    offer_url: 'https://www.tunisianet.com.tn/pc-portable-tunisie/415896-hp-pavilion-15.html'
  },
  {
    id: 5,
    product_name: 'Sony WH-1000XM5 - Casque Audio',
    product_slug: 'sony-wh-1000xm5-casque',
    product_image: 'https://www.tunisianet.com.tn/447349-home/sony-wh-1000xm5.jpg',
    category_code: '1_8',
    merchant_name: 'Tunisianet',
    merchant_logo: 'https://borgiphones.com/wp-content/uploads/2024/02/tunisianet-logo.png',
    current_price: 599,
    original_price: 799,
    discount_percentage: 25,
    offer_url: 'https://www.tunisianet.com.tn/casque-audio-tunisie/447349-sony-wh-1000xm5.html'
  },
  {
    id: 6,
    product_name: ' LG TV OLED 55" 4K Smart',
    product_slug: 'lg-tv-oled-55-4k',
    product_image: 'https://www.tunisianet.com.tn/341585-home/lg-oled-55.jpg',
    category_code: '1_7',
    merchant_name: 'Tunisianet',
    merchant_logo: 'https://borgiphones.com/wp-content/uploads/2024/02/tunisianet-logo.png',
    current_price: 2199,
    original_price: 2999,
    discount_percentage: 27,
    offer_url: 'https://www.tunisianet.com.tn/televiseur-tunisie/341585-lg-oled-55.html'
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

  const offer = mockOffers[currentIndex]

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Close button */}
      <Link href="/" className="absolute top-4 right-4 z-50 p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
        <X className="w-6 h-6 text-white" />
      </Link>

      {/* Stories container */}
      <div className="relative w-full max-w-md bg-black rounded-3xl overflow-hidden shadow-2xl">
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
        <div 
          className="relative h-[70vh] cursor-pointer"
          onClick={prevStory}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Background image */}
          <Image
            src={offer.product_image}
            alt={offer.product_name}
            fill
            className="object-cover"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />

          {/* Merchant info */}
          <div className="absolute top-14 left-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white p-0.5">
              <Image
                src={offer.merchant_logo}
                alt={offer.merchant_name}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
            </div>
            <span className="text-white font-medium text-sm">{offer.merchant_name}</span>
          </div>

          {/* Product info */}
          <div className="absolute bottom-24 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-sm">FLASH</span>
            </div>
            <h2 className="text-white text-xl font-bold mb-2 line-clamp-2">{offer.product_name}</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{offer.current_price} DT</span>
              <span className="text-white/60 line-through text-lg">{offer.original_price} DT</span>
            </div>
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-red-500 rounded-lg">
              <Tag className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-sm">-{offer.discount_percentage}%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="absolute bottom-6 left-4 right-4 flex gap-3">
            <Link
              href={`/produits/${offer.category_code}/${offer.product_slug}`}
              className="flex-1 py-3 bg-white text-black font-bold text-center rounded-xl hover:bg-gray-100 transition"
            >
              Voir le prix
            </Link>
            <a
              href={offer.offer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition flex items-center gap-2"
            >
              Acheter
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Navigation arrows */}
          <button 
            onClick={(e) => { e.stopPropagation(); prevStory() }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); nextStory() }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Swipe hint */}
      <p className="absolute bottom-8 text-white/50 text-sm">
        ← Glissez pour voir plus d'offres →
      </p>
    </div>
  )
}