// components/CategoryStrip.js
import React from 'react'
import Link from 'next/link'

export default function CategoryStrip({ categories }) {
  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 px-3 py-3 sm:px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-800">Browse categories</h2>
        <Link href="/categories">
          <a className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
            View all
          </a>
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/categories/${cat.id}`}>
            <a className="flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 min-w-[96px] text-center shadow-xs">
              <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {String(cat.name || '?')
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="text-xs font-medium text-slate-800 truncate">
                {cat.name}
              </div>
            </a>
          </Link>
        ))}
      </div>
    </div>
  )
}