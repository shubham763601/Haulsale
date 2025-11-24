// pages/products/index.js
import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import ProductCard from '../../components/ProductCard'
import NavBar from '../../components/NavBar'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const PAGE_SIZE = 12

  useEffect(() => {
    fetchProducts()
  }, [q, page])

  async function fetchProducts() {
    setLoading(true)
    try {
      // Basic search by title, join variants
      let query = supabase
        .from('products')
        .select('id, title, description, product_variants(id, price, sku, moq, stock)')
        .order('created_at', { ascending: false })
        .range((page-1)*PAGE_SIZE, page*PAGE_SIZE - 1)

      if (q && q.trim().length) {
        query = supabase
          .from('products')
          .select('id, title, description, product_variants(id, price, sku, moq, stock)')
          .ilike('title', `%${q}%`)
          .order('created_at', { ascending: false })
          .range((page-1)*PAGE_SIZE, page*PAGE_SIZE - 1)
      }

      const { data, error } = await query
      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('fetchProducts', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <NavBar />
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Products</h1>
          <div className="mb-4 flex gap-3">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products" className="px-3 py-2 rounded border" />
            <button onClick={() => { setPage(1); fetchProducts() }} className="px-3 py-2 rounded bg-indigo-600">Search</button>
          </div>

          {loading ? <div>Loading...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          <div className="flex gap-2 justify-center my-6">
            <button disabled={page===1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1 border rounded">Prev</button>
            <span className="px-3 py-1">Page {page}</span>
            <button onClick={() => setPage(p => p+1)} className="px-3 py-1 border rounded">Next</button>
          </div>
        </div>
      </main>
    </>
  )
}
