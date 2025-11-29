// pages/index.js
import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import NavBar from '../components/NavBar'
import { supabase } from '../lib/supabaseClient'

export default function HomePage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const [{ data: catData, error: catErr }, { data: prodData, error: prodErr }] =
          await Promise.all([
            supabase.from('categories').select('id, name').order('name'),
            supabase
              .from('products')
              .select('id, title, description, price')
              .order('created_at', { ascending: false })
              .limit(12),
          ])

        if (catErr) throw catErr
        if (prodErr) throw prodErr

        if (!mounted) return
        setCategories(catData || [])
        setProducts(prodData || [])
      } catch (err) {
        console.error('home load error', err)
        if (mounted) setError('Failed to load marketplace data')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <>
      <Head>
        <title>Haullcell — Wholesale marketplace for local shops</title>
      </Head>

      <div className="min-h-screen bg-slate-50 text-slate-900">
        <NavBar />

        <main className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 pb-16 pt-4 sm:pt-8">
          {/* HERO */}
          <section className="grid gap-6 lg:grid-cols-[3fr,2fr] items-stretch">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 sm:p-8 flex flex-col justify-between">
              <div>
                <p className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 mb-4">
                  B2B wholesale · Built on Supabase
                </p>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">
                  One dashboard for all your shop supplies.
                </h1>
                <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl">
                  Discover verified wholesalers, live stock and transparent pricing.
                  Order everything your store needs in one place — Haullcell.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push('/products')}
                    className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
                  >
                    Browse marketplace
                  </button>
                  <button
                    onClick={() => router.push('/seller')}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Become a seller
                  </button>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 grid gap-3 sm:grid-cols-3 text-xs sm:text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-900">No setup fees</p>
                  <p>Start listing products instantly.</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">UPI & bank-ready</p>
                  <p>Built for Indian wholesalers.</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Admin oversight</p>
                  <p>Verified sellers & KYC checks.</p>
                </div>
              </div>
            </div>

            {/* Right card like Flipkart banners */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/80">
                  Live deals
                </p>
                <h2 className="mt-2 text-xl sm:text-2xl font-semibold">
                  Fast-moving items near you
                </h2>
                <p className="mt-3 text-sm text-indigo-50">
                  Earbuds, chargers, staples, grains and more from city wholesalers.
                  Real-time stock and pricing.
                </p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs bg-white/10 rounded-xl p-3 backdrop-blur">
                <div className="rounded-lg bg-white/90 text-slate-900 p-3">
                  <p className="font-semibold text-sm">Electronics</p>
                  <p className="mt-1 text-xs text-slate-600">Earphones, chargers, bulbs</p>
                </div>
                <div className="rounded-lg bg-white/90 text-slate-900 p-3">
                  <p className="font-semibold text-sm">Groceries</p>
                  <p className="mt-1 text-xs text-slate-600">Rice, atta, pulses & oils</p>
                </div>
                <div className="rounded-lg bg-white/90 text-slate-900 p-3">
                  <p className="font-semibold text-sm">Home essentials</p>
                  <p className="mt-1 text-xs text-slate-600">Cleaning, lighting, plasticware</p>
                </div>
                <div className="rounded-lg bg-white/90 text-slate-900 p-3">
                  <p className="font-semibold text-sm">More categories</p>
                  <p className="mt-1 text-xs text-slate-600">View all suppliers →</p>
                </div>
              </div>
            </div>
          </section>

          {/* ERROR / LOADING STATE */}
          {error && (
            <div className="mt-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* CATEGORY STRIP */}
          <section className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                Browse by category
              </h2>
              <button
                onClick={() => router.push('/products')}
                className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                View all products
              </button>
            </div>

            <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {(categories || []).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => router.push(`/products?category_id=${cat.id}`)}
                    className="min-w-[120px] sm:min-w-[140px] rounded-xl bg-white border border-slate-200 px-4 py-3 text-left shadow-sm hover:shadow-md hover:border-indigo-400 transition-all"
                  >
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {cat.name}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                      View items →
                    </div>
                  </button>
                ))}
                {!loading && categories.length === 0 && (
                  <div className="text-sm text-slate-500 px-2">
                    No categories yet. Admin can create them in the dashboard.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* FEATURED PRODUCTS */}
          <section className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                Featured products
              </h2>
              <span className="text-xs sm:text-sm text-slate-500">
                Live wholesale pricing · MOQ friendly
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading && (
                <>
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse"
                    >
                      <div className="h-4 w-1/2 rounded bg-slate-200" />
                      <div className="mt-2 h-3 w-3/4 rounded bg-slate-100" />
                      <div className="mt-6 h-8 w-1/3 rounded bg-slate-200" />
                    </div>
                  ))}
                </>
              )}

              {!loading &&
                products.map((p) => (
                  <article
                    key={p.id}
                    className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {p.description || 'Wholesale pack from verified seller'}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          ₹{Number(p.price || 0).toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-500">Base price</div>
                      </div>
                      <button
                        onClick={() => router.push(`/products/${p.id}`)}
                        className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-slate-800"
                      >
                        View details
                      </button>
                    </div>
                  </article>
                ))}

              {!loading && products.length === 0 && (
                <p className="text-sm text-slate-500">
                  No products listed yet. Ask sellers to add their first items from the seller
                  dashboard.
                </p>
              )}
            </div>
          </section>

          {/* INFO BAND */}
          <section className="mt-12 rounded-2xl bg-slate-900 text-slate-50 px-4 py-6 sm:px-8 sm:py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">
                Built for Indian kirana & retail stores
              </h2>
              <p className="mt-2 text-sm text-slate-200 max-w-xl">
                MOQ aware ordering, credit-friendly flows and clear GST billing so you can
                focus on running your shop, not chasing suppliers.
              </p>
            </div>
            <button
              onClick={() => router.push('/products')}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-emerald-400 transition-colors"
            >
              Start browsing supplies
            </button>
          </section>

          {/* SELLER CTA */}
          <section className="mt-10">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-6 sm:px-8 sm:py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                  Are you a wholesaler or distributor?
                </h2>
                <p className="mt-2 text-sm text-slate-600 max-w-xl">
                  List your catalogue on Haullcell, manage orders in one console and get
                  paid faster with digital workflows.
                </p>
              </div>
              <button
                onClick={() => router.push('/seller')}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Open seller dashboard
              </button>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}