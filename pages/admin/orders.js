// pages/admin/orders.js
import React, { useEffect, useState } from 'react'
import NavBar from '../../components/NavBar'
import useAdmin from '../../lib/useAdmin'
import { supabase } from '../../lib/supabaseClient'

export default function AdminOrders() {
  const { loading, isAdmin } = useAdmin()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    if (loading || !isAdmin) return
    fetchOrders()
  }, [loading, isAdmin])

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select('id, buyer_id, status, created_at, total_amount')
      .order('created_at', { ascending: false })
      .limit(50)
    setOrders(data || [])
  }

  async function setStatus(orderId, status) {
    const token = (await supabase.auth.getSession()).data?.session?.access_token
    // call service route on orders if you have one; here we update via supabase client (needs service role).
    // We'll use an admin API route for safety (not included here). For now show UI stub:
    const resp = await fetch('/api/admin/set-order-status', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ order_id: orderId, status }),
    })
    if (!resp.ok) {
      alert('Failed to update order status')
    } else {
      fetchOrders()
    }
  }

  if (loading) return <><NavBar /><main className="p-8">Loading...</main></>
  return (
    <>
      <NavBar />
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="p-4 bg-white/5 rounded flex items-center justify-between">
              <div>
                <div className="font-semibold">Order #{o.id}</div>
                <div className="text-sm text-gray-300">Buyer: {o.buyer_id}</div>
                <div className="text-xs text-gray-400">Placed: {new Date(o.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 border rounded">{o.status}</div>
                <select defaultValue={o.status} onChange={e => setStatus(o.id, e.target.value)} className="bg-transparent border px-2 py-1 rounded">
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="packed">packed</option>
                  <option value="shipped">shipped</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
