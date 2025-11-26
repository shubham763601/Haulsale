// pages/admin/user-orders.js
import React, { useEffect, useState } from 'react'
import NavBar from '../../components/NavBar'
import useAdmin from '../../lib/useAdmin'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function AdminUserOrders() {
  const { loading, isAdmin } = useAdmin()
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
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

      // 2) orders for this buyer
      const { data: ords, error: oErr } = await supabase
        .from('orders')
        .select('id, buyer_id, payment_status, status, total, created_at')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })

      if (oErr) {
        console.error('load orders', oErr)
        setError('Failed to load orders')
        setOrders([])
        return
      }

      const ordersArr = ords || []
      if (ordersArr.length === 0) {
        setOrders([])
        return
      }

      const orderIds = ordersArr.map(o => o.id)

      // 3) all order items for these orders
      const { data: items, error: iErr } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, quantity, price')
        .in('order_id', orderIds)

      if (iErr) {
        console.error('load order_items', iErr)
        setError('Failed to load order items')
        setOrders(ordersArr.map(o => ({ ...o, items: [] })))
        return
      }

      const itemsArr = items || []
      if (itemsArr.length === 0) {
        setOrders(ordersArr.map(o => ({ ...o, items: [] })))
        return
      }

      const productIds = Array.from(new Set(itemsArr.map(i => i.product_id).filter(Boolean)))

      // 4) all products for these items to get titles
      let productsMap = new Map()
      if (productIds.length > 0) {
        const { data: prods, error: p2Err } = await supabase
          .from('products')
          .select('id, title')
          .in('id', productIds)

        if (p2Err) {
          console.error('load products for items', p2Err)
        } else {
          (prods || []).forEach(pr => {
            productsMap.set(pr.id, pr)
          })
        }
      }

      // 5) Attach items with product titles to each order
      const itemsByOrder = new Map()
      for (const it of itemsArr) {
        const prod = productsMap.get(it.product_id)
        const extended = {
          ...it,
          product_title: prod?.title || null,
        }
        if (!itemsByOrder.has(it.order_id)) {
          itemsByOrder.set(it.order_id, [])
        }
        itemsByOrder.get(it.order_id).push(extended)
      }

      const withItems = ordersArr.map(o => ({
        ...o,
        items: itemsByOrder.get(o.id) || [],
      }))

      setOrders(withItems)
    } catch (err) {
      console.error('user orders error', err)
      setError('Unexpected error loading orders')
      setOrders([])
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
                User orders
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                All orders placed by this user.
              </p>
              {profile && (
                <p className="text-xs text-slate-400 mt-1">
                  {profile.full_name || '(no name)'} · {profile.email}
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

          {orders.length === 0 && !busy && !error && (
            <div className="text-sm text-slate-300 bg-slate-900/70 p-4 rounded-xl border border-slate-700/80">
              No orders found for this user.
            </div>
          )}

          <div className="space-y-4 mt-2">
            {orders.map(order => (
              <div
                key={order.id}
                className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-4 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                  <div>
                    <div className="text-sm font-semibold">
                      Order #{order.id}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Buyer ID: {order.buyer_id}
                    </div>
                    {profile && (
                      <div className="text-[11px] text-slate-400">
                        Buyer name: {profile.full_name || '(no name)'}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400">
                      Placed: {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="px-2 py-1 rounded-full bg-sky-500/20 border border-sky-500/60 text-sky-100">
                      Payment: {order.payment_status || '—'}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/60 text-emerald-100">
                      Status: {order.status || '—'}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-100">
                      Total: ₹{order.total != null ? Number(order.total).toFixed(2) : '—'}
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="text-xs text-slate-300 mb-1">Items:</div>
                  <div className="space-y-1">
                    {order.items && order.items.length > 0 ? (
                      order.items.map(item => (
                        <div
                          key={item.id}
                          className="flex flex-col md:flex-row md:items-center md:justify-between text-[11px] bg-slate-950/40 px-3 py-2 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-slate-100">
                              {item.product_title || `Product ${item.product_id}`}
                            </div>
                            <div className="text-slate-400">
                              order_item_id: {item.id} · product_id: {item.product_id}
                            </div>
                          </div>
                          <div className="mt-1 md:mt-0 text-right">
                            <div className="text-slate-200">Qty: {item.quantity}</div>
                            <div className="text-slate-300">
                              Price: ₹{item.price != null ? Number(item.price).toFixed(2) : '—'}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-500">
                        No items found for this order.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
