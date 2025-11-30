// pages/products/index.js
import React, { useState, useContext } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import NavBar from '../../components/NavBar'
import { CartContext } from '../../lib/cartContext'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

function makePublicUrl(path) {
  if (!path || !SUPABASE_URL) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  // storage_path is like "product-images/xyz.jpg"
  return `${SUPABASE_URL}/storage/v1/object/public/public-assets/${path}`
}

function ProductRow({ product }) {
  const { addItem } = useContext(CartContext)
  const [qty, setQty] = useState(1)

  const imageUrl = product.imageUrl || makePublicUrl(product.imagePath)

  const price = Number(product.price || 0)
  const mrp = Number(product.mrp || 0)
  const hasDiscount = mrp && mrp > price
  const offPct = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : null

  const rating = product.rating || 0
  const ratingCount = product.rating_count || 0

  function handleAddToCart() {
    if (!addItem) return
    addItem({
      product_id: product.id,
      variant_id: null, // later you can wire actual variant
      title: product.title,
      price,
      mrp: mrp || null,
      imageUrl,
      qty,
      seller_id: product.seller_id || null,
      stock: product.stock ?? null,
    })
    // we'll replace this with drawer/ toast later
    alert('Added to cart')
  }

  return (
    <div className="mb-3 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-150">
      <div className="flex gap-3 p-3 sm:p-4">
        {/* IMAGE LEFT */}
        <Link href={`/products/${product.id}`}>
          <a className="flex-shrink-0">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[11px] text-slate-400">
                  <div className="mb-1 h-8 w-8 rounded-full bg-slate-200" />
                  <span>No image</span>
                </div>
              )}

              {offPct && (
                <div className="absolute left-1.5 top-1.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                  {offPct}% OFF
                </div>
              )}
            </div>
          </a>
        </Link>

        {/* MIDDLE: DETAILS */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <Link href={`/products/${product.id}`}>
            <a className="text-sm font-medium text-slate-900 line-clamp-2 hover:text-indigo-600">
              {product.title}
            </a>
          </Link>

          {/* rating row */}
          {ratingCount > 0 && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {rating.toFixed(1)} ★
              </span>
              <span className="text-slate-500">({ratingCount})</span>
            </div>
          )}

          {/* description */}
          {product.description && (
            <p className="line-clamp-2 text-xs text-slate-500">
              {product.description}
            </p>
          )}

          {/* price row */}
          <div className="mt-1 flex flex-wrap items-baseline gap-2 text-sm">
            <span className="font-semibold text-emerald-600">
              ₹{price.toFixed(2)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs text-slate-400 line-through">
                  ₹{mrp.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  {offPct}% off
                </span>
              </>
            )}
          </div>

          {typeof product.stock === 'number' && (
            <div className="text-[11px] text-slate-500">
              Stock: {product.stock}
            </div>
          )}
        </div>

        {/* RIGHT: QTY + ADD TO CART */}
        <div className="flex flex-col items-end justify-center gap-2">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5">
            <button
              type="button"
              className="h-7 w-7 text-sm font-semibold text-slate-700 hover:text-slate-900"
              onClick={() => setQty(q => (q > 1 ? q - 1 : 1))}
            >
              –
            </button>
            <div className="mx-1 h-7 min-w-[32px] rounded-full bg-white px-2 text-center text-xs font-medium text-slate-800 flex items-center justify-center">
              {qty}
            </div>
            <button
              type="button"
              className="h-7 w-7 text-sm font-semibold text-slate-700 hover:text-slate-900"
              onClick={() => setQty(q => q + 1)}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage({ products, initialQ }) {
  const router = useRouter()
  const [search, setSearch] = useState(initialQ || '')

  function handleSearchSubmit(e) {
    e.preventDefault()
    const params = new URLSearchParams(router.query)
    if (search) params.set('q', search)
    else params.delete('q')
    router.push(`/products?${params.toString()}`)
  }

  return (
    <>
      <Head>
        <title>Products – Haullcell</title>
      </Head>

      <div className="flex min-h-screen flex-col bg-slate-50">
        <NavBar />

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 sm:px-4 lg:px-6 py-4">
          {/* header + search (extra search just for this page) */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-lg font-semibold text-slate-900">
              All products
            </h1>

            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full max-w-md items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm"
            >
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                className="hidden rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 sm:inline-flex"
              >
                Search
              </button>
            </form>
          </div>

          {products.length === 0 ? (
            <p className="text-sm text-slate-500">
              No products found. Try a different search or category.
            </p>
          ) : (
            <div>
              {products.map(p => (
                <ProductRow key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  )
}

export async function getServerSideProps(ctx) {
  const { q = '', category = '' } = ctx.query

  let query = supabase
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
      product_variants ( price, stock ),
      product_images ( storage_path )
    `
    )

  if (q) {
    query = query.ilike('title', `%${q}%`)
  }
  if (category) {
    query = query.eq('category_id', category)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(60)

  if (error) {
    console.error('products page query error', error)
  }

  const products =
    data?.map(p => {
      const variant = Array.isArray(p.product_variants)
        ? p.product_variants[0]
        : null
      const image = Array.isArray(p.product_images)
        ? p.product_images[0]
        : null

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        category_id: p.category_id,
        price: variant?.price ?? p.price ?? 0,
        stock: variant?.stock ?? null,
        mrp: p.mrp ?? null,
        rating: p.rating ?? null,
        rating_count: p.rating_count ?? 0,
        imagePath: image?.storage_path ?? null,
        imageUrl: makePublicUrl(image?.storage_path ?? null),
      }
    }) ?? []

  return {
    props: {
      products,
      initialQ: q || '',
    },
  }
}
