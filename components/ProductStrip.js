// components/ProductStrip.js
import React from 'react'
import Link from 'next/link'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

function ProductCard({ product }) {
  const price =
    typeof product.price === 'number'
      ? `₹${product.price.toFixed(2)}`
      : '—'

  // Optional MRP / rating – will only show if you later add these fields
  const mrp =
    typeof product.mrp === 'number' && product.mrp > (product.price || 0)
      ? product.mrp
      : null

  const rating =
    typeof product.rating === 'number' && product.rating > 0
      ? product.rating
      : null

  const discountPct =
    mrp && product.price
      ? Math.round(((mrp - product.price) / mrp) * 100)
      : null

  // Real image URL from Supabase storage (bucket: public-assets)
  const imageUrl =
    SUPABASE_URL && product.imagePath
      ? `${SUPABASE_URL}/storage/v1/object/public/public-assets/${product.imagePath}`
      : null

  return (
    <Link href={`/products/${product.id}`}>
      <a className="group relative flex-shrink-0 w-40 sm:w-44 md:w-48 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
        {/* Discount badge */}
        {discountPct && (
          <div className="absolute left-2 top-2 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            {discountPct}% OFF
          </div>
        )}

        {/* Image wrapper – fixed size, no cropping */}
        <div className="mt-2 mx-2 rounded-xl bg-slate-50 border border-slate-100 h-28 sm:h-32 md:h-36 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title || 'Product image'}
              className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 text-[11px]">
              <div className="w-10 h-10 rounded-full bg-slate-200 mb-1" />
              <span>No image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-3 pb-3 pt-2">
          <p className="text-[11px] text-slate-500 mb-0.5 line-clamp-1">
            {product.category_name || 'Wholesale product'}
          </p>

          <p className="text-xs sm:text-sm font-medium text-slate-900 line-clamp-2 min-h-[2.6em] group-hover:text-indigo-600">
            {product.title}
          </p>

          {/* Rating row – only shows if rating present */}
          {rating && (
            <div className="mt-1 flex items-center gap-1 text-[11px]">
              <span className="inline-flex items-center rounded-sm bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {rating.toFixed(1)} ★
              </span>
              <span className="text-slate-400">Rated</span>
            </div>
          )}

          {/* Price + stock */}
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-sm font-semibold text-emerald-600">
              {price}
            </span>
            {mrp && (
              <span className="text-[11px] text-slate-400 line-through">
                ₹{mrp.toFixed(2)}
              </span>
            )}
          </div>

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

      {/* Horizontal strip of *fixed-size* cards (Flipkart style) */}
      <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
