// pages/index.js
import React from 'react'
import Head from 'next/head'
import NavBar from '../components/NavBar'
import { supabase } from '../lib/supabaseClient'
import HeroCarousel from '../components/HeroCarousel'
import CategoryStrip from '../components/CategoryStrip'
import ProductStrip from '../components/ProductStrip'

export default function HomePage({ categories, featuredProducts, dealProducts }) {
  return (
    <>
      <Head>
        <title>Haullcell – Wholesale marketplace</title>
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavBar />

        <main className="flex-1">
          {/* Hero + right side */}
          <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
            <div className="grid gap-4 lg:grid-cols-[2.5fr,1fr]">
              <HeroCarousel />
              <div className="hidden lg:flex flex-col gap-3">
                <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide opacity-80">
                    For retailers
                  </p>
                  <h3 className="mt-1 font-semibold text-sm">
                    Bulk deals every day
                  </h3>
                  <p className="mt-1 text-xs opacity-90">
                    Pre-negotiated wholesale pricing from verified sellers.
                  </p>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-600">
                    Want to sell on Haullcell?
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Create a seller account and list your wholesale catalogue.
                  </p>
                  <a
                    href="become-seller"
                    className="mt-3 inline-flex items-center justify-center rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-amber-400"
                  >
                    Become a seller
                  </a>
                </div>
              </div>
            </div>

            {/* Category strip */}
            <div className="mt-6">
              <CategoryStrip categories={categories} />
            </div>
          </div>

          {/* Product strips */}
          <section className="bg-white border-y border-slate-200">
            <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-6">
              <ProductStrip
                title="Featured products"
                subtitle="Popular items from verified wholesalers"
                products={featuredProducts}
              />
            </div>
          </section>

          <section className="bg-slate-50">
            <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-6">
              <ProductStrip
                title="Deals for your shop"
                subtitle="Fast-moving items at sharp prices"
                products={dealProducts}
              />
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-4 flex flex-col sm:flex-row justify-between text-xs text-slate-500 gap-2">
            <p>© {new Date().getFullYear()} Haullcell. Built for Indian wholesalers.</p>
            <p>Powered by Supabase · Secure OTP auth</p>
          </div>
        </footer>
      </div>
    </>
  )
}

function makePublicUrl(storagePath) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  if (!storagePath || !baseUrl) return null

  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath
  }

  if (storagePath.startsWith('public-assets/')) {
    return `${baseUrl}/storage/v1/object/public/${storagePath}`
  }

  return `${baseUrl}/storage/v1/object/public/public-assets/${storagePath}`
}

export async function getServerSideProps() {
  // ---- categories ----
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, name, icon_path')
    .order('id', { ascending: true })
    .limit(12)

  // ---- products ----
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

  // only show approved & active products on public homepage
  const { data: featured } = await supabase
    .from('products')
    .select(productSelect)
    .eq('approved', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(15)

  const { data: deals } = await supabase
    .from('products')
    .select(productSelect)
    .eq('approved', true)
    .eq('is_active', true)
    .order('price', { ascending: true })
    .limit(15)

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
        price: firstVariant?.price ?? p.price ?? null,
        stock: firstVariant?.stock ?? null,
        imagePath: firstImage?.storage_path ?? null,
        mrp: p.mrp ?? null,
        rating: p.rating ?? null,
        rating_count: p.rating_count ?? null,
      }
    })
  }

  const categories =
    (categoriesData || []).map((c) => ({
      id: c.id,
      name: c.name,
      iconPath: c.icon_path || null,
      iconUrl: c.icon_path ? makePublicUrl(c.icon_path) : null,
    }))

  return {
    props: {
      categories,
      featuredProducts: normalizeProducts(featured),
      dealProducts: normalizeProducts(deals),
    },
  }
}
