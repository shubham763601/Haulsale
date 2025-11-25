// pages/account/orders.js
import Head from 'next/head'
import React, { useContext, useEffect, useState } from 'react'
import NavBar from '../../components/NavBar'
import UserContext from '../../lib/userContext'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function OrdersPage() {
  const { user } = useContext(UserContext)
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function loadOrders() {
      setLoading(true)
      setError(null)
      if (!user) {
        setOrders([])
        setLoading(false)
        return
      }

      try {
        // get orders for buyer and include order_items + product title
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            created_at,
            total,
            order_items (
              id, product_id, variant_id, quantity, price,
              product:products ( id, title )
            )
          `)
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('load orders', error)
          setError('Failed to load orders')
        } else {
          if (mounted) setOrders(data || [])
        }
      } catch (err) {
        console.error(err)
        setError('Unexpected error loading orders')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadOrders()
    return () => { mounted = false }
  }, [user])

  if (loading) return <>
    <NavBar />
    <main className="min-h-screen p-8">Loading orders...</main>
  </>

  if (!user) return <>
    <NavBar />
    <main className="min-h-screen p-8">Please sign in to view orders.</main>
  </>

  return (
    <>
      <Head><title>Your orders — Haulcell</title></Head>
      <NavBar />
      <main className="min-h-screen p-8">
        <section className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Your orders</h1>
          {error && <div className="text-red-400 mb-4">{error}</div>}
          {orders.length === 0 && <div className="text-gray-300">You have not placed any orders yet.</div>}

          <div className="space-y-4 mt-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white/5 p-4 rounded">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-white font-semibold">Order #{order.id}</div>
                    <div className="text-sm text-gray-300">{new Date(order.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">Status: {order.status}</div>
                    {order.total !== undefined && <div className="text-gray-300">Total: ₹{Number(order.total).toFixed(2)}</div>}
                  </div>
                </div>

                <div className="mt-2">
                  <div className="text-sm text-gray-300 mb-2">Items:</div>
                  <ul className="space-y-2">
                    {order.order_items?.map(item => (
                      <li key={item.id} className="text-white">
                        <div className="text-sm">
                          {item.product?.title ?? `Product ${item.product_id}`} — qty {item.quantity} — ₹{Number(item.price).toFixed(2)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
