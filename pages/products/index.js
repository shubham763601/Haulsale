// pages/products/index.js
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../../lib/supabaseClient'
import NavBar from '../../components/NavBar'
import ProductCard from '../../components/ProductCard'
import { useState, useEffect } from 'react'

function makePublicUrl(path) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!path || !baseUrl) return null
  if (path.startsWith('http')) return path
  return `${baseUrl}/storage/v1/object/public/public-assets/${path}`
}

export default function ProductsPage({ initialProducts }) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts || [])
  const [loading, setLoading] = useState(false)

  const search = router.query.search || ''
  const category = router.query.category || null

  // Refetch client-side whenever filters change
  useEffect(() => {
    async function load() {
      setLoading(true)
      const query = new URLSearchParams()
      if (search) query.set('search', search)
      if (category) query.set('category', category)

      const resp = await fetch(`/api/products?${query.toString()}`)
      const data = await resp.json()
      setProducts(data.products || [])
      setLoading(false)
    }

    // only refetch if page already loaded data once
    if (initialProducts.length > 0) load()
  }, [search, category])

  return (
    <>
      <Head>
        <title>Products — Haullcell</title>
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavBar />

        <main className="mx-auto max-w-6xl px-4 py-6 flex-1">
          <h1 className="text-lg font-semibold text-slate-900 mb-4">
            {search ? `Results for “${search}”` : category ? 'Category Products' : 'All Products'}
          </h1>

          {loading && (
            <p className="text-slate-500 text-sm">Loading...</p>
          )}

          {!loading && products.length === 0 && (
            <p className="text-slate-500 text-sm">No matching products found.</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </main>
      </div>
    </>
  )
}

// SSR initial load
export async function getServerSideProps({ query }) {
  const { search, category } = query

  // Build filter
  let q = supabase
    .from('products')
    .select(`
      id,
      title,
      price,
      mrp,
      rating,
      rating_count,
      category_id,
      description,
      product_variants(price, stock),
      product_images(storage_path)
    `)

  if (search) q = q.ilike('title', `%${search}%`)
  if (category) q = q.eq('category_id', category)

  const { data } = await q.limit(40)

  const normalized = (data || []).map((p) => {
    const firstImg = p.product_images?.[0]
    const firstVar = p.product_variants?.[0]

    return {
      ...p,
      price: firstVar?.price ?? p.price ?? 0,
      stock: firstVar?.stock ?? null,
      imagePath: firstImg?.storage_path || null,
      imageUrl: firstImg ? makePublicUrl(firstImg.storage_path) : null,
    }
  })

  return {
    props: {
      initialProducts: normalized,
    },
  }
}
