// pages/categories/[id].js
import React, { useState, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import NavBar from '../../components/NavBar'
import { supabase } from '../../lib/supabaseClient'
import { useCart } from '../../context/CartContext'

// ---------- helpers ----------
function makePublicUrl(storagePath) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  if (!storagePath || !baseUrl) return null

  // already full URL
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath
  }

  // storagePath might already include bucket
  if (storagePath.startsWith('public-assets/')) {
    return `${baseUrl}/storage/v1/object/public/${storagePath}`
  }

  // normal case: "product-images/atta-50kg.jpg"
  return `${baseUrl}/storage/v1/object/public/public-assets/${storagePath}`
}

// ---------- Row UI: 1 product per row ----------
function ProductRow({ product }) {
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const imageUrl = product.imageUrl || makePublicUrl(product.imagePath)

  const price = Number(product.price || 0)
  const mrp = Number(product.mrp || 0)
  const hasDiscount = mrp > price
  const offPct = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : null

  const rating = product.rating || 0
  const ratingCount = product.rating_count || 0

  function handleAddToCart() {
    if (!addItem || isAdding) return

    addItem({
      product_id: product.id,
      variant_id: null, // later if you use variants
      title: product.title,
      price,
      mrp: mrp || null,
      imageUrl,
      qty,
      seller_id: product.seller_id || null,
      stock: product.stock ?? null,
    })

    setIsAdding(true)
    setTimeout(() => setIsAdding(false), 400)
  }

  return (
    <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition">
      <div className="flex gap-3 sm:gap-4">
        {/* IMAGE */}
        <Link href={`/products/${product.id}`}>
          <a className="flex-shrink-0">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center">
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

        {/* MIDDLE: details */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <Link href={`/products/${product.id}`}>
            <a className="text-sm font-medium text-slate-900 line-clamp-2 hover:text-indigo-600">
              {product.title}
            </a>
          </Link>

          {/* rating */}
          {ratingCount > 0 && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {rating.toFixed ? rating.toFixed(1) : rating} ★
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

          {/* price */}
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

        {/* RIGHT: qty + add */}
        <div className="flex flex-col items-end justify-center gap-2">
          {/* qty pill */}
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5">
            <button
              type="button"
              className="h-7 w-7 text-sm font-semibold text-slate-700 hover:text-slate-900"
              onClick={() => setQty((q) => (q > 1 ? q - 1 : 1))}
            >
              –
            </button>
            <div className="mx-1 h-7 min-w-[32px] rounded-full bg-white px-2 text-center text-xs font-medium text-slate-800 flex items-center justify-center">
              {qty}
            </div>
            <button
              type="button"
              className="h-7 w-7 text-sm font-semibold text-slate-700 hover:text-slate-900"
              onClick={() => setQty((q) => q + 1)}
            >
              +
            </button>
          </div>

          {/* add to cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all ${
              isAdding
                ? 'bg-emerald-600 scale-[0.96]'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {isAdding ? 'Added ✓' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- main page ----------
export default function CategoryPage({ category, products }) {
  // you can add sorting later if needed
  const sorted = useMemo(() => products || [], [products])

  return (
    <>
      <Head>
        <title>
          {category ? `${category.name} – Haullcell` : 'Category – Haullcell'}
        </title>
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavBar />

        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
                  {category ? category.name : 'Category'}
                </h1>
                <p className="text-xs text-slate-500">
                  Browse wholesale products in this category.
                </p>
              </div>
            </div>

            {/* Product list (rows) */}
            {(!sorted || sorted.length === 0) && (
              <div className="mt-8 text-sm text-slate-500">
                No products found in this category yet.
              </div>
            )}

            {sorted && sorted.length > 0 && (
              <div className="mt-4">
                {sorted.map((p) => (
                  <ProductRow key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}

// ---------- server side ----------
export async function getServerSideProps({ params }) {
  const categoryId = Number(params.id)

  if (Number.isNaN(categoryId)) {
    return { notFound: true }
  }

  // load the category
  const { data: categoryData } = await supabase
    .from('categories')
    .select('id, name, icon_path')
    .eq('id', categoryId)
    .maybeSingle()

  if (!categoryData) {
    return { notFound: true }
  }

  const productSelect = `
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

  const { data: productData, error: productErr } = await supabase
    .from('products')
    .select(productSelect)
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (productErr) {
    console.error('category products error', productErr)
  }

  function normalizeProducts(list) {
    if (!list) return []
    return list.map((p) => {
      const firstVariant = Array.isArray(p.product_variants)
        ? p.product_variants[0]
        : null
      const firstImage = Array.isArray(p.product_images)
        ? p.product_images[0]
        : null

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        category_id: p.category_id ?? null,
        price: firstVariant?.price ?? p.price ?? 0,
        stock: firstVariant?.stock ?? null,
        imagePath: firstImage?.storage_path ?? null,
        mrp: p.mrp ?? null,
        rating: p.rating ?? null,
        rating_count: p.rating_count ?? 0,
        // you *can* also precompute full URL, but row uses makePublicUrl
        imageUrl: null,
      }
    })
  }

  const category = {
    id: categoryData.id,
    name: categoryData.name,
    iconPath: categoryData.icon_path || null,
    iconUrl: categoryData.icon_path
      ? makePublicUrl(categoryData.icon_path)
      : null,
  }

  return {
    props: {
      category,
      products: normalizeProducts(productData),
    },
  }
}