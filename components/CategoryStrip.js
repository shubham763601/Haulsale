// components/CategoryStrip.js
import React from 'react'
import Link from 'next/link'

export default function CategoryStrip({ categories }) {
  if (!categories || categories.length === 0) return null

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm sm:text-base font-semibold text-slate-900">
          Browse categories
        </h2>
        <Link href="/categories">
          <a className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
            View all
          </a>
        </Link>
      </div>

      {/* Horizontal scroll of category chips */}
      <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/categories/${cat.id}`}>
            <a className="flex-shrink-0 flex flex-col items-center min-w-[72px]">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-1 border border-indigo-100">
                {cat.iconUrl ? (
                  <img
                    src={cat.iconUrl}
                    alt={cat.name}
                    className="w-8 h-8 object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-sm font-semibold text-indigo-600">
                    {cat.name?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-700 text-center line-clamp-2">
                {cat.name}
              </span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  )
}
