// components/ProductStrip.js
import React from 'react'
import Link from 'next/link'
import ProductCard from './ProductCard'

export default function ProductStrip({ title, subtitle, products }) {
  if (!products || products.length === 0) return null

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        <Link href="/products">
          <a className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
            View all
          </a>
        </Link>
      </div>

      {/* Flipkart-style horizontal strip with fixed-size cards */}
      <div
        className="
          flex gap-3 overflow-x-auto pb-2
          [&::-webkit-scrollbar]:h-1.5
          [-webkit-overflow-scrolling:touch]
        "
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
