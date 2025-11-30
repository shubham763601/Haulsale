// pages/products/index.js
import React, { useState, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import NavBar from '../../components/NavBar'
import { useCart } from "../../context/CartContext" // 🔥 FIXED

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

function makePublicUrl(path) {
  if (!path || !SUPABASE_URL) return null
  if (path.startsWith('http')) return path
  return `${SUPABASE_URL}/storage/v1/object/public/public-assets/${path}`
}

// ──────────────────────────
// Product Row (Horizontal UI)
// ──────────────────────────
function ProductRow({ product }) {
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const imageUrl = product.imageUrl || makePublicUrl(product.imagePath)

  const price = Number(product.price || 0)
  const mrp = Number(product.mrp || 0)
  const hasDiscount = mrp > price
  const offPct = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : null

  function handleAddToCart() {
    if (isAdding) return

    addItem({
      product_id: product.id,
      title: product.title,
      imageUrl,
      price,
      mrp,
      qty,
      stock: product.stock,
    })

    setIsAdding(true)
    setTimeout(() => setIsAdding(false), 500)
  }

  return (
    <div className="mb-3 border rounded-2xl bg-white p-3 shadow-sm hover:shadow-md">
      <div className="flex gap-4">
        {/* IMAGE */}
        <Link href={`/products/${product.id}`}>
          <a className="flex-shrink-0">
            <div className="h-24 w-24 rounded-lg bg-slate-50 border overflow-hidden flex items-center justify-center">
              {imageUrl ? (
                <img className="object-contain max-h-full" src={imageUrl} />
              ) : (
                <span className="text-xs text-slate-400">No Image</span>
              )}
              {offPct && (
                <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {offPct}% OFF
                </div>
              )}
            </div>
          </a>
        </Link>

        {/* DETAILS */}
        <div className="flex flex-1 flex-col justify-center">
          <Link href={`/products/${product.id}`}>
            <a className="font-medium text-sm text-slate-900 line-clamp-2 hover:text-indigo-600">
              {product.title}
            </a>
          </Link>

          {product.rating_count > 0 && (
            <div className="mt-1 flex items-center gap-1 text-xs">
              <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                {product.rating.toFixed(1)} ★
              </span>
              <span className="text-slate-400">({product.rating_count})</span>
            </div>
          )}

          <p className="text-xs text-slate-500 line-clamp-1">
            {product.description}
          </p>

          <div className="mt-1 flex gap-2 items-baseline">
            <span className="text-emerald-600 font-semibold text-sm">₹{price.toFixed(0)}</span>
            {hasDiscount && (
              <>
                <span className="line-through text-xs text-slate-400">₹{mrp}</span>
                <span className="text-[11px] font-semibold text-emerald-600">{offPct}% off</span>
              </>
            )}
          </div>
        </div>

        {/* ADD SIDE */}
        <div className="flex flex-col justify-center items-end gap-2">
          {/* QTY SELECT */}
          <div className="flex items-center gap-2 border rounded-full bg-slate-50 px-2 py-1">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}>–</button>
            <span className="w-6 text-center text-xs">{qty}</span>
            <button onClick={() => setQty(q => q + 1)}>+</button>
          </div>

          {/* ADD TO CART */}
          <button
            onClick={handleAddToCart}
            className={`${isAdding ? "bg-emerald-600 scale-95" : "bg-indigo-600 hover:bg-indigo-500"} 
              px-4 py-1.5 rounded-full text-[11px] font-semibold text-white shadow transition-all`}
          >
            {isAdding ? "Added ✓" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────
// Main Products Page
// ──────────────────────────
export default function ProductsPage({ products, initialQ, categoryName }) {
  const router = useRouter()
  const [search, setSearch] = useState(initialQ)
  const [sortMode, setSortMode] = useState('relevance') 

  const sortedProducts = useMemo(() => {
    let arr = [...products]
    if (sortMode === "top-rated") arr.sort((a,b)=>b.rating-a.rating)
    if (sortMode === "low-price") arr.sort((a,b)=>a.price-b.price)
    return arr
  }, [products, sortMode])

  function searchSubmit(e) {
    e.preventDefault()
    const params = new URLSearchParams(router.query)
    search ? params.set("q", search) : params.delete("q")
    router.push(`/products?${params.toString()}`)
  }

  return (
    <>
      <Head><title>Products – Haulcell</title></Head>
      <NavBar />

      <main className="max-w-6xl mx-auto px-3 py-4">
        {/* SEARCH BAR */}
        <form
          onSubmit={searchSubmit}
          className="bg-white rounded-full border px-4 py-2 mb-4 flex"
        >
          <input
            className="flex-1 outline-none"
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search products..."
          />
        </form>

        {/* SORT */}
        <div className="mb-3 text-xs flex gap-2">
          {[
            {id:"relevance", label:"Relevance"},
            {id:"top-rated", label:"Top Rated"},
            {id:"low-price", label:"Lowest Price"}
          ].map(s=>(
            <button
              key={s.id}
              onClick={()=>setSortMode(s.id)}
              className={`px-3 py-1 rounded-full border ${sortMode===s.id ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-white border-slate-200 text-slate-600"}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* LIST */}
        {sortedProducts.map(p => (
          <ProductRow key={p.id} product={p} />
        ))}
      </main>
    </>
  )
}

// ──────────────────────────
// Server props
// ──────────────────────────
export async function getServerSideProps(ctx) {
  const { q="", category="" } = ctx.query

  let query = supabase.from("products").select(`
    id,title,description,price,mrp,rating,rating_count,category_id,
    product_variants(price,stock),
    product_images(storage_path)
  `)

  if (q) query = query.ilike("title", `%${q}%`)
  if (category) query = query.eq("category_id", category)

  const { data } = await query.order("created_at", { ascending: false })

  const products = (data ?? []).map(p => ({
    ...p,
    price: p.product_variants?.[0]?.price ?? p.price,
    stock: p.product_variants?.[0]?.stock ?? null,
    imagePath: p.product_images?.[0]?.storage_path ?? null,
    imageUrl: makePublicUrl(p.product_images?.[0]?.storage_path),
  }))

  return {
    props: {
      products,
      initialQ: q,
      categoryName: null
    }
  }
}
