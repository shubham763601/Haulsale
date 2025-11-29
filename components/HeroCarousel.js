// components/HeroCarousel.js
import React, { useEffect, useState } from 'react'

const slides = [
  {
    id: 1,
    title: 'One dashboard for all your shop supplies',
    body: 'Browse live stock, MOQ-friendly cartons and wholesale pricing from verified sellers.',
    pill: 'B2B wholesale',
    badge: 'Built on Supabase',
  },
  {
    id: 2,
    title: 'Order from multiple sellers in one place',
    body: 'Compare prices, view variants and place orders in a single, simple workflow.',
    pill: 'Multi-seller cart',
    badge: 'For Indian retailers',
  },
  {
    id: 3,
    title: 'Become a Haullcell seller',
    body: 'List your wholesale catalogue, manage orders, and see payouts – all in one console.',
    pill: 'Seller console',
    badge: 'No setup fees',
  },
]

export default function HeroCarousel() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length)
    }, 7000)
    return () => clearInterval(id)
  }, [])

  const slide = slides[active]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 text-white shadow-md">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#ffffff_0,_transparent_55%)]" />

      <div className="relative px-5 sm:px-8 py-6 sm:py-8 flex flex-col gap-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
          <span className="rounded-full bg-white/20 px-2 py-0.5">{slide.pill}</span>
          <span className="opacity-80">{slide.badge}</span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight">
            {slide.title}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-indigo-50/80 max-w-xl">
            {slide.body}
          </p>
        </div>

        <div className="mt-1 flex flex-wrap gap-2 text-xs sm:text-sm">
          <a
            href="/products"
            className="inline-flex items-center rounded-md bg-amber-400 px-4 py-2 font-semibold text-slate-900 shadow-sm hover:bg-amber-300"
          >
            Browse products
          </a>
          <a
            href="/auth/signup"
            className="inline-flex items-center rounded-md border border-white/40 px-4 py-2 font-semibold text-white hover:bg-white/10"
          >
            Create account
          </a>
        </div>

        <div className="mt-4 flex gap-1">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? 'w-6 bg-white' : 'w-2 bg-white/40'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}