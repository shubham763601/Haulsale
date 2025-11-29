// pages/index.js
import React from 'react'
import Head from 'next/head'
import NavBar from '../components/NavBar'
import { supabase } from '../lib/supabaseClient'
import HeroCarousel from '../components/HeroCarousel'
import CategoryStrip from '../components/CategoryStrip'
import ProductStrip from '../components/ProductStrip'

// Helper: build public URL for an object in the `public-assets` bucket
function buildImageUrl(storagePath) {
  if (!storagePath) return null
  // Example final URL:
  // https://czbenpqyprcyhkdprbuz.supabase.co/storage/v1/object/public/public-assets/product-images/atta-50kg.jpg
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '')
  if (!baseUrl) return null
  return `${baseUrl}/storage/v1/object/public/public-assets/${storagePath}`
}

export default function HomePage({ categories, featuredProducts, dealProducts }) {
  return (
    <>
      <Head>
        <title>Haullcell – Wholesale marketplace</title>
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavBar />

        <main className="flex-1">
          {/* Top hero + category strip */}
          <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
            <div className="grid gap-4 lg:grid-cols-[2.5fr,1fr]">
              <HeroCarousel />

              {/* Right-side promo / CTA */}
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
                    href="/seller"
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

export async function getServerSideProps() {
  // Load categories (name + id — CategoryStrip can stay as it was)
  const { data: categoriesData, error: catError } = await supabase
    .from('categories')
    .select('id, name')
    .order('id', { ascending: true })
    .limit(12)

  if (catError) {
    console.error('load categories', catError)
  }

  // Load products + first variant + first image
  const commonSelect = `
    id,
    title,
    price,
    description,
    product_variants ( price, stock ),
    product_images ( storage_path )
  `

  const { data: featured, error: featError } = await supabase
    .from('products')
    .select(commonSelect)
    .order('created_at', { ascending: false })
    .limit(15)

  if (featError) {
    console.error('load featured products', featError)
  }

  const { data: deals, error: dealsError } = await supabase
    .from('products')
    .select(commonSelect)
    .order('price', { ascending: true })
    .limit(15)

  if (dealsError) {
    console.error('load deal products', dealsError)
  }

  function normalizeProducts(list) {
    if (!list) return []
    return list.map((p) => {
      const rawPath = p.product_images?.[0]?.storage_path ?? null
      const imageUrl = buildImageUrl(rawPath)

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.product_variants?.[0]?.price ?? p.price ?? null,
        stock: p.product_variants?.[0]?.stock ?? null,
        imagePath: rawPath,   // old field – keep for backward compatibility
        imageUrl,             // new full URL – use this in ProductCard if available
      }
    })
  }

  return {
    props: {
      categories: categoriesData ?? [],
      featuredProducts: normalizeProducts(featured),
      dealProducts: normalizeProducts(deals),
    },
  }
}