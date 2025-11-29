// pages/index.js
import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import NavBar from '../components/NavBar'
import { supabase } from '../lib/supabaseClient'

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Load categories
        const { data: catData, error: catErr } = await supabase
          .from('categories')
          .select('id, name')
          .order('name', { ascending: true })

        if (catErr) throw catErr

        // Load featured products (first few active products)
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('id, title, price, category_id')
          .order('created_at', { ascending: false })
          .limit(12)

        if (prodErr) throw prodErr

        if (!mounted) return
        setCategories(catData || [])
        setFeatured(prodData || [])
      } catch (err) {
        console.error('load homepage data', err)
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

  function formatPrice(p) {
    if (p == null) return '—'
    const num = Number(p)
    if (Number.isNaN(num)) return '—'
    return `₹${num.toFixed(2)}`
  }

  return (
    <>
      <Head>
        <title>Haulcell — Wholesale marketplace</title>
      </Head>
      <NavBar />

      <main className="min-h-screen bg-slate-50">
        {/* Hero */}
        <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-center sm:px-6 lg:py-14">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                B2B wholesale · Built on Supabase
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                One dashboard for all your
                <span className="text-indigo-600"> shop supplies.</span>
              </h1>
              <p className="max-w-xl text-sm text-slate-600 sm:text-base">
                Haulcell connects local retailers with verified wholesalers. Discover
                better prices, live stock, and simple ordering — all in one place.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/auth/signup">
                  <a className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                    Create new account
                  </a>
                </Link>
                <Link href="/dashboard/seller">
                  <a className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:border-indigo-400">
                    Become a seller
                  </a>
                </Link>
              </div>

              <div className="pt-3 text-[11px] text-slate-500">
                No setup fees · UPI ready · Built for Indian wholesalers
              </div>
            </div>

            <div className="flex-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Live categories</span>
                  <span>Fast-moving items</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    {categories.slice(0, 4).map(cat => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700"
                      >
                        <span>{cat.name}</span>
                        <span className="text-[10px] text-slate-400">View</span>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <div className="rounded-xl bg-slate-50 px-3 py-6 text-xs text-slate-500">
                        Categories will appear here once created.
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {featured.slice(0, 4).map(p => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs"
                      >
                        <div className="truncate text-slate-800">{p.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {formatPrice(p.price)}
                        </div>
                      </div>
                    ))}
                    {featured.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-xs text-slate-500">
                        Featured products will appear here after sellers add them.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Error banner */}
        {error && (
          <div className="bg-rose-50 border-y border-rose-100">
            <div className="mx-auto max-w-6xl px-4 py-3 text-sm text-rose-700 sm:px-6">
              {error}
            </div>
          </div>
        )}

        {/* Categories strip */}
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Browse by category
            </h2>
            <Link href="/categories">
              <a className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </a>
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  // later we can route to /categories/[id]
                }}
                className="flex min-w-[110px] flex-col items-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs hover:border-indigo-400"
              >
                <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-700">
                  {cat.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="truncate text-slate-800">{cat.name}</div>
                <div className="text-[10px] text-slate-500">
                  Wholesale deals
                </div>
              </button>
            ))}
            {categories.length === 0 && !loading && (
              <div className="text-xs text-slate-500">
                No categories yet. Create them from admin.
              </div>
            )}
          </div>
        </section>

        {/* Featured products grid */}
        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Featured products
            </h2>
            <Link href="/products">
              <a className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                View catalog
              </a>
            </Link>
          </div>

          {loading ? (
            <div className="text-sm text-slate-500">Loading products…</div>
          ) : featured.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
              No products have been added yet. Once sellers publish items,
              they’ll show up here.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {featured.map(p => (
                <Link key={p.id} href={`/products/${p.id}`}>
                  <a className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-3 text-xs hover:border-indigo-400 hover:shadow-sm">
                    <div className="mb-2 flex h-28 w-full items-center justify-center rounded-xl bg-slate-50 text-[11px] text-slate-400">
                      {/* Later: show product image from product_images */}
                      Product image
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 line-clamp-2 text-[13px] font-medium text-slate-900 group-hover:text-indigo-600">
                        {p.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatPrice(p.price)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-600">
                        In stock
                      </span>
                      <span className="text-[11px] text-slate-500">
                        View details →
                      </span>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}