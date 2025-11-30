// pages/products/index.js
import React, { useMemo, useState } from 'react'
import Head from 'next/head'
import NavBar from '../../components/NavBar'
import { supabase } from '../../lib/supabaseClient'
import ProductCard from '../../components/ProductCard'

export default function ProductsPage({ products }) {
  const [sortBy, setSortBy] = useState('top-rated')

  const sorted = useMemo(() => {
    const list = [...products]
    switch (sortBy) {
      case 'lowest-price':
        return list.sort((a, b) => (a.price || 0) - (b.price || 0))
      case 'best-selling':
        // approximate: use rating_count as "popularity"
        return list.sort(
          (a, b) =>
            (b.rating_count || b.ratingCount || 0) -
            (a.rating_count || a.ratingCount || 0)
        )
      case 'newest':
        return list.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
      case 'top-rated':
      default:
        return list.sort(
          (a, b) => (b.rating || 0) - (a.rating || 0)
        )
    }
  }, [products, sortBy])

  return (
    <>
      <Head>
        <title>All products — Haullcell</title>
      </Head>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavBar />
        <main className="flex-1 mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-slate-900">
              All products
            </h1>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-slate-500">Sort by</span>
              <select
                className="border border-slate-200 rounded-md bg-white px-2 py-1 text-xs sm:text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="top-rated">Top Rated</option>
                <option value="best-selling">Best Selling</option>
                <option value="lowest-price">Lowest Price</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {sorted.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </main>
      </div>
    </>
  )
}

export async function getServerSideProps() {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      title,
      description,
      price,
      mrp,
      rating,
      rating_count,
      created_at,
      product_variants ( price, stock ),
      product_images ( storage_path )
    `
    )
    .limit(120)

  if (error) {
    console.error('products listing error', error)
  }

  function normalize(list) {
    if (!list) return []
    return list.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price:
        p.product_variants?.[0]?.price ??
        p.price ??
        null,
      mrp: p.mrp ?? null,
      rating: p.rating ?? 0,
      rating_count: p.rating_count ?? 0,
      created_at: p.created_at,
      stock: p.product_variants?.[0]?.stock ?? null,
      imagePath: p.product_images?.[0]?.storage_path ?? null,
    }))
  }

  return {
    props: {
      products: normalize(data),
    },
  }
}
