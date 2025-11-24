// pages/index.js
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import NavBar from '../components/NavBar'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        // fetch latest products with variants (non-blocking if table absent)
        const { data, error } = await supabase
          .from('products')
          .select('id, title, description, product_variants(id, price, sku, stock)')
          .order('created_at', { ascending: false })
          .limit(6)
        if (error) {
          console.debug('No products or fetch error on homepage', error)
        } else if (mounted) {
          setFeatured(data || [])
        }
      } catch (err) {
        console.error('home load error', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <>
      <Head>
        <title>Haullcell — Wholesale marketplace</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <NavBar />

      <main className="min-h-screen p-8 bg-gray-900 text-white">
        <header className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold">Haullcell</h1>
            <p className="mt-2 text-gray-300 max-w-xl">
              A simple wholesale marketplace MVP — browse products, add to cart, and place orders.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/products"><a className="px-4 py-2 rounded bg-indigo-600">Browse products</a></Link>
              <Link href="/auth/signup"><a className="px-4 py-2 rounded border">Create account</a></Link>
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <div className="bg-gradient-to-br from-indigo-700 to-purple-700 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold">Why Haullcell?</h3>
              <ul className="mt-3 text-sm text-gray-100 list-disc list-inside">
                <li>B2B focused flows — MOQ, variants, seller pricing</li>
                <li>Supabase auth with OTP & password set</li>
                <li>Pluggable payments & admin tools</li>
              </ul>
            </div>
          </div>
        </header>

        <section className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Featured products</h2>

          {loading ? (
            <div>Loading products…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(featured.length ? featured : Array.from({length:3})).map((p, i) => (
                <motion.div key={p?.id ?? i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 p-4 rounded">
                  <h3 className="text-lg font-semibold">{p?.title ?? 'Sample product'}</h3>
                  <p className="text-sm text-gray-300 mt-2">{p?.description ?? 'This is a sample placeholder description.'}</p>
                  <div className="mt-3">
                    {p?.product_variants?.length ? (
                      <div className="text-sm">
                        From ₹{Math.min(...p.product_variants.map(v => Number(v.price || 0)))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No pricing</div>
                    )}
                  </div>
                  <div className="mt-3">
                    <Link href={p?.id ? `/products/${p.id}` : '/products'}>
                      <a className="text-indigo-400 underline">View</a>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
