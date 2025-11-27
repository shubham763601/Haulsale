// pages/seller/orders.js
import React, { useEffect, useState } from 'react'
import SellerLayout from '../../components/SellerLayout'
import { supabase } from '../../lib/supabaseClient'

export default function SellerOrdersPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([]) // each: { order, items: [] }
  const [user, setUser] = useState(null)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user ?? null
      if (mounted) setUser(u)
      if (u) loadForSeller(u.id)
    })
    return () => { mounted = false }
  }, [])

  async function loadForSeller(uid) {
    setLoading(true)
    try {
      // 1) Get products for seller
      const { data: prods } = await supabase
        .from('products')
        .select('id, title')
        .eq('seller_id', uid)

      const productIds = (prods || []).map(p => p.id)
      if (productIds.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      // 2) Get order_items for these product ids
      const { data: items } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, quantity, price')
        .in('product_id', productIds)
        .order('id', { ascending: false })

      const itemsArr = items || []
      const orderIds = Array.from(new Set(itemsArr.map(i => i.order_id)))
      if (orderIds.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      // 3) fetch orders for these orderIds
      const { data: ords } = await supabase
        .from('orders')
        .select('id, buyer_id, payment_status, status, total, created_at')
        .in('id', orderIds)
        .order('created_at', { ascending: false })

      // 4) map product titles
      const productsMap = new Map((prods || []).map(p => [p.id, p]))

      // 5) group items by order
      const itemsByOrder = {}
      itemsArr.forEach(it => {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = []
        itemsByOrder[it.order_id].push({ ...it, product_title: productsMap.get(it.product_id)?.title || null })
      })

      // 6) combine
      const withItems = (ords || []).map(o => ({ order: o, items: itemsByOrder[o.id] || [] }))

      setOrders(withItems)
    } catch (err) {
      console.error('load seller orders', err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <SellerLayout title="Orders">
      <div className="max-w-5xl mx-auto space-y-4">
        <h2 className="text-lg font-semibold">Orders containing your products</h2>

        {loading ? <div>Loading...</div> : (
          orders.length === 0
            ? <div className="text-slate-400">No orders found for your products yet.</div>
            : orders.map(({ order, items }) => (
              <div key={order.id} className="bg-slate-800/60 rounded p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Order #{order.id}</div>
                    <div className="text-xs text-slate-400">Buyer: {order.buyer_id} — Placed: {new Date(order.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-xs text-slate-300">Payment: {order.payment_status}</div>
                    <div className="text-xs text-slate-300">Status: {order.status}</div>
                    <div className="text-xs text-emerald-300">Total: ₹{Number(order.total || 0).toFixed(2)}</div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {items.map(it => (
                    <div key={it.id} className="flex items-center justify-between bg-slate-900/40 p-2 rounded">
                      <div>
                        <div className="font-medium">{it.product_title || `Product ${it.product_id}`}</div>
                        <div className="text-xs text-slate-400">Qty: {it.quantity} · price: ₹{Number(it.price).toFixed(2)}</div>
                      </div>
                      <div className="text-xs text-slate-300">item id: {it.id}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </SellerLayout>
  )
}
s