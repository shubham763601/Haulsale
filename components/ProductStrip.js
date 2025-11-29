// components/ProductStrip.js
import React from 'react'
import Link from 'next/link'

function ProductCard({ product }) {
  const price =
    typeof product.price === 'number'
      ? `₹${product.price.toFixed(2)}`
      : '—'

  return (
    <Link href={`/products/${product.id}`}>
      <a className="group flex-shrink-0 w-40 sm:w-48 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-shadow duration-150">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-slate-100">
          {/* Placeholder image; later you can generate from storage url */}
          <div className="flex h-full items-center justify-center text-slate-400 text-xs">
            {product.imagePath ? 'Image' : 'No image'}
          </div>
        </div>
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-slate-900 line-clamp-2 group-hover:text-indigo-600">
            {product.title}
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-600">{price}</p>
          {product.stock != null && (
            <p className="mt-0.5 text-[11px] text-slate-500">
              Stock: {product.stock}
            </p>
          )}
        </div>
      </a>
    </Link>
  )
}

export default function ProductStrip({ title, subtitle, products }) {
  if (!products || products.length === 0) {
    return null
  }

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

      <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}