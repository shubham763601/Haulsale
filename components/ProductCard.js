// components/ProductCard.js
import React from 'react'
import Link from 'next/link'

function StarIcon(props) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M10 1.5 12.6 7l5.1.4-3.9 3.3 1.2 5-4.9-2.8-4.9 2.8 1.2-5L2.3 7.4 7.4 7z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function ProductCard({ product }) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // product.imagePath should be like: "product-images/atta-50kg.jpg"
  const imageUrl =
    baseUrl && product.imagePath
      ? `${baseUrl}/storage/v1/object/public/public-assets/${product.imagePath}`
      : null

  const price = Number(product.price || 0)
  const mrp = product.mrp != null ? Number(product.mrp) : 0
  const hasDiscount = mrp && mrp > price
  const offPct = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : null

  const rating = Number(product.rating || 0)
  const ratingCount =
    product.rating_count != null
      ? Number(product.rating_count)
      : Number(product.ratingCount || 0)

  return (
    <Link href={`/products/${product.id}`}>
      <a
        className="
          group bg-white rounded-2xl shadow-sm border border-slate-200
          overflow-hidden flex flex-col
          w-[150px] sm:w-[180px] md:w-[200px]
          hover:shadow-lg hover:-translate-y-1 transition-all duration-200
        "
      >
        {/* Image wrapper: fixed aspect, object-contain so nothing gets cut */}
        <div className="relative w-full aspect-[3/4] bg-slate-50 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title || 'Product image'}
              className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-300 text-xs">
              <div className="w-12 h-12 rounded-full bg-slate-200 mb-2" />
              <span>No image</span>
            </div>
          )}

          {hasDiscount && (
            <div className="absolute top-2 left-2 rounded-full bg-emerald-600 text-[10px] font-semibold text-white px-2 py-0.5 shadow-sm">
              {offPct}% OFF
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-3 flex flex-col flex-1">
          <h3 className="font-medium text-slate-900 text-sm line-clamp-2 min-h-[2.75rem] group-hover:text-indigo-600">
            {product.title}
          </h3>

          {/* Rating row (Flipkart-style pill) */}
          {ratingCount > 0 && rating > 0 && (
            <div className="mt-1 flex items-center gap-1 text-[11px]">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-emerald-600 text-white font-semibold">
                <StarIcon className="w-3 h-3" />
                {rating.toFixed(1)}
              </span>
              <span className="text-slate-500">({ratingCount})</span>
            </div>
          )}

          {/* Price + MRP + %off */}
          <div className="mt-2 flex flex-col gap-0.5 text-sm">
            <span className="font-semibold text-slate-900">
              ₹{price.toFixed(2)}
            </span>

            {hasDiscount && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400 line-through">
                  ₹{mrp.toFixed(2)}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600">
                  {offPct}% off
                </span>
              </div>
            )}
          </div>

          {typeof product.stock === 'number' && (
            <div className="mt-1 text-[11px] text-slate-500">
              Stock: {product.stock}
            </div>
          )}
        </div>
      </a>
    </Link>
  )
}
