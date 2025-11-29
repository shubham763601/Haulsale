// components/ProductCard.js
import React from 'react'
import Link from 'next/link'

export default function ProductCard({ product }) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Prefer fully-built URL coming from server
  let imageUrl = product.imageUrl || null

  // Fallback: build from imagePath if imageUrl missing
  if (!imageUrl && baseUrl && product.imagePath) {
    const rawPath = product.imagePath

    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
      imageUrl = rawPath
    } else if (rawPath.startsWith('public-assets/')) {
      imageUrl = `${baseUrl}/storage/v1/object/public/${rawPath}`
    } else {
      // assume it's inside public-assets bucket
      imageUrl = `${baseUrl}/storage/v1/object/public/public-assets/${rawPath}`
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      {/* Image */}
      <div className="w-full h-40 bg-white flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title || 'Product image'}
            className="object-contain w-full h-full"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
            <div className="w-12 h-12 rounded-full bg-slate-200 mb-2" />
            <span>No image</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <div className="text-xs text-slate-500 mb-1 truncate">
          {product.category_name || 'Uncategorized'}
        </div>
        <h3 className="font-medium text-slate-900 text-sm line-clamp-2 mb-1">
          {product.title}
        </h3>
        {product.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-2">
            {product.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between text-sm">
          <div>
            <div className="text-emerald-600 font-semibold">
              ₹{Number(product.price || 0).toFixed(2)}
            </div>
            {typeof product.stock === 'number' && (
              <div className="text-[11px] text-slate-500">
                Stock: {product.stock}
              </div>
            )}
          </div>

          <Link href={`/products/${product.id}`}>
            <a className="group w-36 sm:w-44 md:w-48 flex-shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-150">
              View
            </a>
          </Link>
        </div>
      </div>
    </div>
  )
}
