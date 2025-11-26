// pages/admin/user-products.js
import React, { useEffect, useState } from 'react'
import NavBar from '../../components/NavBar'
import useAdmin from '../../lib/useAdmin'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function AdminUserProducts() {
  const { loading, isAdmin } = useAdmin()
  const [profile, setProfile] = useState(null)
  const [seller, setSeller] = useState(null)
  const [products, setProducts] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()
  const userId = router.query.user_id // profiles.id

  useEffect(() => {
    if (loading || !isAdmin) return
    if (!userId) return
    load()
  }, [loading, isAdmin, userId])

  async function load() {
    setBusy(true)
    setError(null)
    try {
      // 1) profile
      const { data: p, error: pErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', userId)
        .maybeSingle()

      if (pErr) {
        console.error('load profile', pErr)
        setError('Failed to load profile')
        setProfile(null)
      } else {
        setProfile(p)
      }

      // 2) seller row (shop_name, gstin)
      const { data: s, error: sErr } = await supabase
        .from('sellers')
        .select('id, auth_user_id, shop_name, gstin')
        .eq('auth_user_id', userId)
        .maybeSingle()

      if (sErr) {
        console.error('load seller', sErr)
        // Not fatal: user may not be a seller
      }
      setSeller(s || null)

      // 3) products where products.seller_id = profiles.id (same as sellers.auth_user_id)
      const { data: prods, error: prodErr } = await supabase
        .from('products')
        .select('id, title, price, seller_id, created_at')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })

      if (prodErr) {
        console.error('load products', prodErr)
        setError('Failed to load products')
        setProducts([])
        return
      }

      setProducts(prods || [])
    } catch (err) {
      console.error('user products error', err)
      setError('Unexpected error loading products')
      setProducts([])
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <>
        <NavBar />
        <main className="p-8 text-white">Checking admin access…</main>
      </>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <NavBar />
        <main className="p-8 text-white">Access denied.</main>
      </>
    )
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen p-6 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <section className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                User products
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                All products where this user is the seller.
              </p>
              {profile && (
                <p className="text-xs text-slate-400 mt-1">
                  {profile.full_name || '(no name)'} · {profile.email}
                </p>
              )}
              {seller && (
                <p className="text-xs text-slate-400 mt-1">
                  Shop: {seller.shop_name || '(no shop name)'} · GSTIN: {seller.gstin || '—'}
                </p>
              )}
            </div>
            <button
              onClick={() => router.push('/admin/users')}
              className="px-3 py-1.5 rounded-full text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600"
            >
              ← Back to users
            </button>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-300 bg-red-900/30 border border-red-500/60 rounded-lg p-3">
              {error}
            </div>
          )}

          {busy && (
            <div className="mb-4 text-sm text-slate-300">Loading…</div>
          )}

          {products.length === 0 && !busy && !error && (
            <div className="text-sm text-slate-300 bg-slate-900/70 p-4 rounded-xl border border-slate-700/80">
              No products found for this user.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {products.map(prod => (
              <div
                key={prod.id}
                className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-4 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="font-semibold text-sm mb-1">
                  {prod.title || '(no title)'}
                </div>
                <div className="text-xs text-slate-300">
                  Product ID: {prod.id}
                </div>
                <div className="text-xs text-slate-300">
                  Seller (user id): {prod.seller_id}
                </div>
                {seller && (
                  <>
                    <div className="text-xs text-slate-300 mt-1">
                      Shop: {seller.shop_name || '—'}
                    </div>
                    <div className="text-xs text-slate-300">
                      GSTIN: {seller.gstin || '—'}
                    </div>
                  </>
                )}
                <div className="text-xs text-emerald-300 mt-1">
                  Price: ₹{prod.price != null ? Number(prod.price).toFixed(2) : '—'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Created: {prod.created_at ? new Date(prod.created_at).toLocaleString() : '—'}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
