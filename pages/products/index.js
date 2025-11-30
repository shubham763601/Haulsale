// pages/products/index.js
import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import NavBar from '../../components/NavBar'
import { useCart } from '../../context/CartContext'

// build Supabase public URL for an image
function makePublicUrl(path) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!path || !baseUrl) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${baseUrl}/storage/v1/object/public/public-assets/${path}`
}

export default function ProductsPage({ products }) {
  const router = useRouter()
  const { addItem } = useCart()
  const [qtyMap, setQtyMap] = useState(() =>
    Object.fromEntries((products || []).map((p) => [p.id, 1]))
  )

  const search = router.query.search || ''
  const category = router.query.category || null

  function changeQty(id, delta) {
    setQtyMap((prev) => {
      const current = prev[id] || 1
      const next = Math.max(1, current + delta)
      return { ...prev, [id]: next }
    })
  }

  function handleAddToCart(p) {
    const qty = qtyMap[p.id] || 1
    const imageUrl = p.imageUrl || makePublicUrl(p.imagePath)

    addItem({
      product_id: p.id,
      variant_id: null, // later you can wire real variant_id if you want
      title: p.title,
      price: p.price || 0,
      mrp: p.mrp || null,
      imageUrl,
      qty,
      seller_id: p.seller_id || null,
      stock: p.stock ?? null,
    })

    // You can replace with a nicer toast later
    alert('Added to cart')
  }

  return (
    <>
      <Head>
        <title>Products — Haullcell</title>
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavBar />

        <main className="mx-auto max-w-6xl px-4 py-6 flex-1">
          {/* Heading */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
                {search
                  ? `Results for “${search}”`
                  : category
                  ? 'Category products'
                  : 'All products'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Wholesale catalogue from verified sellers.
              </p>
            </div>
          </div>

          {/* Empty state */}
          {(!products || products.length === 0) && (
            <div className="mt-8 rounded-xl bg-white border border-slate-200 p-6 text-sm text-slate-600">
              No matching products found. Try changing your search or filters.
            </div>
          )}

          {/* Horizontal list: 1 product per row */}
          <div className="flex flex-col gap-3">
            {products.map((p) => {
              const price = Number(p.price || 0)
              const mrp = Number(p.mrp || 0)
              const hasDiscount = mrp && mrp > price
              const offPct = hasDiscount
                ? Math.round(((mrp - price) / mrp) * 100)
                : null
              const rating = p.rating || 0
              const ratingCount = p.rating_count || 0
              const rowQty = qtyMap[p.id] || 1
              const imageUrl = p.imageUrl || makePublicUrl(p.imagePath)

              return (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-150 p-3 sm:p-4"
                >
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={p.title || 'Product image'}
                          className="max-h-full max-w-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          No image
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div
                        className="text-sm sm:text-base font-medium text-slate-900 line-clamp-2 cursor-pointer hover:text-indigo-600"
                        onClick={() => router.push(`/products/${p.id}`)}
                      >
                        {p.title}
                      </div>

                      {p.description && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                          {p.description}
                        </p>
                      )}

                      {/* Rating */}
                      {ratingCount > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-[11px]">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white font-medium">
                            {rating.toFixed(1)} ★
                          </span>
                          <span className="text-slate-500">
                            ({ratingCount})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price / stock */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base sm:text-lg font-semibold text-emerald-600">
                          ₹{price.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <>
                            <span className="text-xs text-slate-400 line-through">
                              ₹{mrp.toFixed(2)}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-600">
                              {offPct}% off
                            </span>
                          </>
                        )}
                      </div>
                      {typeof p.stock === 'number' && (
                        <span className="text-[11px] text-slate-500">
                          Stock: {p.stock}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: qty + add to cart */}
                  <div className="flex sm:flex-col items-end sm:items-stretch justify-between sm:justify-center gap-2 sm:gap-3">
                    {/* Qty controls */}
                    <div className="inline-flex items-center border border-slate-200 rounded-full bg-slate-50 px-1 py-0.5">
                      <button
                        className="px-2 py-1 text-sm text-slate-700"
                        onClick={() => changeQty(p.id, -1)}
                      >
                        –
                      </button>
                      <div className="px-3 py-1 text-sm text-slate-900 border-x border-slate-200 min-w-[36px] text-center">
                        {rowQty}
                      </div>
                      <button
                        className="px-2 py-1 text-sm text-slate-700"
                        onClick={() => changeQty(p.id, +1)}
                      >
                        +
                      </button>
                    </div>

                    {/* Add to cart */}
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-500 whitespace-nowrap"
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </>
  )
}

// SERVER-SIDE: search + category filters
export async function getServerSideProps({ query }) {
  const { search, category } = query

  let q = supabase
    .from('products')
    .select(
      `
      id,
      title,
      price,
      mrp,
      rating,
      rating_count,
      description,
      category_id,
      seller_id,
      product_variants ( price, stock ),
      product_images ( storage_path )
    `
    )

  if (search) {
    q = q.ilike('title', `%${search}%`)
  }
  if (category) {
    q = q.eq('category_id', category)
  }

  const { data, error } = await q.limit(50)

  if (error) {
    console.error('products page error:', error)
    return { props: { products: [] } }
  }

  const products =
    (data || []).map((p) => {
      const firstVar = Array.isArray(p.product_variants)
        ? p.product_variants[0]
        : null
      const firstImg = Array.isArray(p.product_images)
        ? p.product_images[0]
        : null

      const price = firstVar?.price ?? p.price ?? 0
      const stock = firstVar?.stock ?? null
      const imagePath = firstImg?.storage_path ?? null

      return {
        ...p,
        price,
        stock,
        imagePath,
        imageUrl: makePublicUrl(imagePath),
      }
    })

  return {
    props: {
      products,
    },
  }
}
