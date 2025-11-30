// components/CategoryStrip.js
import React from 'react'
import Link from 'next/link'

export default function CategoryStrip({ categories }) {
  if (!categories || categories.length === 0) return null

  return (
    <section className="rounded-2xl bg-white border border-slate-200 shadow-sm px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            Browse categories
          </h2>
          <p className="text-xs text-slate-500">
            Shop by department from verified wholesalers
          </p>
        </div>
        <Link href="/categories">
          <a className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
            View all
          </a>
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5">
        {categories.map((cat) => {
          const initial = cat.name?.[0]?.toUpperCase() || '?'
          const iconUrl = cat.iconUrl

          return (
            <Link key={cat.id} href={`/categories?selected=${cat.id}`}>
              <a className="flex-shrink-0 w-20 sm:w-24 flex flex-col items-center group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden group-hover:bg-indigo-100 transition-colors">
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt={cat.name}
                      className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold text-indigo-600">
                      {initial}
                    </span>
                  )}
                </div>
                <span className="mt-1 text-[11px] text-slate-700 text-center leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </a>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
