// pages/index.js
import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import NavBar from '../components/NavBar'
import { supabase } from '../lib/supabaseClient'

export default function HomePage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [catRes, prodRes] = await Promise.all([
          supabase
            .from('categories')
            .select('id, name')
            .order('id', { ascending: true })
            .limit(6),
          supabase
            .from('products')
            .select('id, title, price, category_id')
            .order('created_at', { ascending: false })
            .limit(8),
        ])

        if (catRes.error) throw catRes.error
        if (prodRes.error) throw prodRes.error

        if (!cancelled) {
          setCategories(catRes.data || [])
          setFeaturedProducts(prodRes.data || [])
        }
      } catch (err) {
        console.error('load homepage', err)
        if (!cancelled) setError('Failed to load marketplace data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <Head>
        <title>Haullcell — Wholesale marketplace</title>
      </Head>

      {/* Top navigation */}
      <NavBar />

      {/* Main content */}
      <main className="min-h-screen bg-slate-50">
        {/* Hero */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 lg:py-16">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  B2B wholesale · Built on Supabase
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  One dashboard for all your shop supplies.
                </h1>
                <p className="mt-4 max-w-xl text-slate-600">
                  Haullcell connects local retailers with verified wholesalers.
                  Discover better prices, live stock and simple ordering — all in one place.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push('/products')}
                    className="btn-primary"
                  >
                    Browse products
                  </button>
                  <button
                    onClick={() => router.push('/seller')}
                    className="btn-secondary"
                  >
                    Become a seller
                  </button>
                </div>

                <dl className="mt-6 grid gap-4 text-sm text-slate-500 sm:grid-cols-3">
                  <div>
                    <dt className="font-medium text-slate-700">No setup fees</dt>
                    <dd>Start listing in minutes.</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-700">UPI & bank-ready</dt>
                    <dd>Built for Indian wholesalers.</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-700">Admin tools</dt>
                    <dd>Approve sellers, track orders.</dd>
                  </div>
                </dl>
              </div>

              {/* Right side highlight card */}
              <div className="flex-1">
                <div className="card bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg">
                  <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
                    Why Haullcell?
                  </p>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li>• B2B flows — MOQ, variants & seller pricing</li>
                    <li>• Supabase auth with OTP & password</li>
                    <li>• Pluggable payments & seller dashboards</li>
                    <li>• Built to scale on Postgres</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Browse by category */}
        <section className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Browse by category
            </h2>
            <button
              onClick={() => router.push('/categories')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {loading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-slate-200"
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No categories yet. Admin can add categories from the dashboard.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-3 md:grid-cols-4">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() =>
                    router.push(`/products?category_id=${cat.id}`)
                  }
                  className="card flex flex-col items-start hover:border-indigo-200 hover:shadow-md"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-600">
                    {cat.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="mt-3 text-left">
                    <p className="text-sm font-medium text-slate-900">
                      {cat.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      View products in this category
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Featured products */}
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Featured products
              </h2>
              <button
                onClick={() => router.push('/products')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Browse all
              </button>
            </div>

            {loading ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="h-40 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : featuredProducts.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No products yet. Once sellers add inventory, it will appear here.
              </p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {featuredProducts.map(p => (
                  <div
                    key={p.id}
                    className="card flex cursor-pointer flex-col justify-between hover:border-indigo-200 hover:shadow-md"
                    onClick={() => router.push(`/products/${p.id}`)}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                        {p.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Category #{p.category_id || '—'}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        ₹{Number(p.price || 0).toFixed(2)}
                      </p>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        In stock
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}