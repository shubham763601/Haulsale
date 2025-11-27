// pages/seller/index.js
import React, { useEffect, useState } from 'react'
import SellerLayout from '../../components/SellerLayout'
import { supabase } from '../../lib/supabaseClient'

export default function SellerOverviewPage() {
  const [user, setUser] = useState(null)
  const [counts, setCounts] = useState({ products: 0, orders: 0, revenue: 0, payouts: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user ?? null
      if (mounted) setUser(u)
      if (u) loadCounts(u.id)
    })
    return () => { mounted = false }
  }, [])

  async function loadCounts(uid) {
    setLoading(true)
    try {
      // 1) products by seller_id
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', uid)

      const productIds = (products || []).map(p => p.id)
      const productsCount = productIds.length

      // 2) order_items where product_id in productIds
      let orderItems = []
      if (productIds.length > 0) {
        const { data: items } = await supabase
          .from('order_items')
          .select('order_id, product_id, quantity, price')
          .in('product_id', productIds)
        orderItems = items || []
      }

      // 3) orders count (unique order_ids) and revenue sum
      const orderIds = Array.from(new Set(orderItems.map(i => i.order_id)))
      let revenue = 0
      orderItems.forEach(i => {
        revenue += Number(i.price || 0) * Number(i.quantity || 0)
      })

      // 4) payouts count or sum
      const { data: payouts } = await supabase
        .from('payouts')
        .select('id, amount')
        .eq('seller_id', uid)

      const payoutsSum = (payouts || []).reduce((s, p) => s + Number(p.amount || 0), 0)

      setCounts({ products: productsCount, orders: orderIds.length, revenue, payouts: payoutsSum })
    } catch (err) {
      console.error('overview load', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SellerLayout title="Overview">
      <div className="max-w-5xl mx-auto space-y-4">
        <h2 className="text-xl font-semibold">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 rounded-lg p-4">
            <div className="text-xs text-slate-300">Products</div>
            <div className="text-2xl font-bold mt-2">{loading ? '...' : counts.products}</div>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-4">
            <div className="text-xs text-slate-300">Orders</div>
            <div className="text-2xl font-bold mt-2">{loading ? '...' : counts.orders}</div>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-4">
            <div className="text-xs text-slate-300">Revenue</div>
            <div className="text-2xl font-bold mt-2">₹{loading ? '...' : counts.revenue.toFixed(2)}</div>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-4">
            <div className="text-xs text-slate-300">Payouts</div>
            <div className="text-2xl font-bold mt-2">₹{loading ? '...' : counts.payouts.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg p-4">
          <h3 className="font-medium">Recent orders involving your products</h3>
          <p className="text-sm text-slate-400 mt-2">See orders that include at least one of your products.</p>
          {/* We'll show a small preview: fetch the latest order items, then the orders */}
        </div>
      </div>
    </SellerLayout>
  )
}