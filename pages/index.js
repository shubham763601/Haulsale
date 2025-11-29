// pages/index.js
import React from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import ProductCard from '../components/ProductCard'

export default function Home({ categories, featured, fastMoving }) {
  return (
    <div className="space-y-8 pb-20">
      {/* Hero Banner */}
      <div className="h-40 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl shadow-md" />

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Browse categories</h2>
          <Link href="/categories">
            <a className="text-sm text-indigo-600 hover:underline">View all</a>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-4 px-4">
            {categories.map((c) => (
              <Link key={c.id} href={`/categories/${c.id}`}>
                <a className="flex flex-col items-center justify-center w-24">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {c.name[0]}
                  </div>
                  <span className="text-xs mt-2 text-slate-700 text-center">
                    {c.name}
                  </span>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Featured products</h2>
          <Link href="/products">
            <a className="text-sm text-indigo-600 hover:underline">View all</a>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-[70%] gap-4 px-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Fast-moving */}
      <section>
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Deals for your shop
          </h2>
          <Link href="/products">
            <a className="text-sm text-indigo-600 hover:underline">View all</a>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-[70%] gap-4 px-4">
            {fastMoving.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export async function getServerSideProps() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('id')

  // Fetch featured products with image + stock + category
  const { data: featured } = await supabase
    .from('products')
    .select(`
      id,
      title,
      price,
      stock,
      categories (
        name
      ),
      product_images (
        storage_path
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch fast moving (same for now)
  const { data: fastMoving } = await supabase
    .from('products')
    .select(`
      id,
      title,
      price,
      stock,
      categories (
        name
      ),
      product_images (
        storage_path
      )
    `)
    .order('stock', { ascending: false })
    .limit(10)

  // Massage data so ProductCard can show image
  const normalize = (list) =>
    (list || []).map((p) => ({
      ...p,
      imagePath: p.product_images?.[0]?.storage_path ?? null,
      category_name: p.categories?.name ?? null,
    }))

  return {
    props: {
      categories: categories || [],
      featured: normalize(featured),
      fastMoving: normalize(fastMoving),
    },
  }
}