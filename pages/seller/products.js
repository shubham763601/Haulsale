// pages/seller/products.js
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import SellerLayout from '../../components/SellerLayout'
import { supabase } from '../../lib/supabaseClient'

export default function SellerProductsPage() {
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function init() {
      const { data } = await supabase.auth.getSession()
      const u = data?.session?.user ?? null
      if (!mounted) return
      setUser(u)
      if (u) {
        await loadProducts(u.id)
      } else {
        setLoading(false)
      }
    }

    init()
    return () => {
      mounted = false
    }
  }, [])

  async function loadProducts(uid) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, created_at, is_active')
        .eq('seller_id', uid)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('load products', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SellerLayout title="Products">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your products</h2>
          <Link href="/seller/products/new">
            <a className="px-3 py-2 rounded-md bg-amber-500 text-slate-900 font-medium text-sm">
              + Add product
            </a>
          </Link>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : products.length === 0 ? (
          <div className="bg-slate-800/60 p-4 rounded">
            <p className="text-slate-300 text-sm">
              You have no products yet. Click &quot;Add product&quot; to create your first listing.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-slate-800/60 p-3 rounded flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-slate-400">
                    ₹{Number(p.price || 0).toFixed(2)} · ID: {p.id}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Created: {p.created_at ? new Date(p.created_at).toLocaleString() : '—'}
                  </div>
                </div>
                <div className="text-xs text-slate-300">
                  Status:{' '}
                  <span className={p.is_active ? 'text-emerald-300' : 'text-red-300'}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SellerLayout>
  )
}
