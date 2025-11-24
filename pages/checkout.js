// pages/checkout.js
import React, { useContext, useState } from 'react'
import NavBar from '../components/NavBar'
import { CartContext } from '../lib/cartContext'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import UserContext from '../lib/userContext'

export default function CheckoutPage() {
  const { items, total, clear } = useContext(CartContext)
  const { user } = React.useContext(UserContext)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handlePlaceOrder(e) {
    e?.preventDefault()
    setError(null)
    if (!user) {
      setError('Please sign in before placing order')
      return
    }
    if (!items.length) {
      setError('Cart is empty')
      return
    }

    setLoading(true)
    try {
      // Insert order (for simplicity, one order contains items possibly from multiple sellers)
      // In a full system, split by seller, create separate orders per seller.
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert([{ buyer_id: user.id, total: total, status: 'pending' }])
        .select()
      if (orderErr) throw orderErr
      const order = Array.isArray(orderData) ? orderData[0] : orderData

      // Insert order_items
      const itemsPayload = items.map(i => ({
        order_id: order.id,
        variant_id: i.variant_id,
        qty: i.qty,
        price: i.price
      }))
      const { data: itemsInserted, error: itemsErr } = await supabase
        .from('order_items')
        .insert(itemsPayload)
      if (itemsErr) throw itemsErr

      // Optionally: create payments row (status pending) and redirect to payment provider
      await supabase.from('payments').insert([{ order_id: order.id, provider: 'none', amount: total, status: 'pending' }])

      // Clear cart and redirect to order page
      clear()
      router.push(`/orders/${order.id}`)
    } catch (err) {
      console.error('place order', err)
      setError(err.message || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <NavBar />
      <main className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <div className="mb-4">
          <h2 className="font-semibold">Order summary</h2>
          {items.map(i => <div key={i.variant_id} className="flex justify-between py-2 border-b">{i.title} x {i.qty} <span>₹{i.qty * i.price}</span></div>)}
          <div className="mt-2 font-bold">Total ₹{total}</div>
        </div>

        <div>
          <button disabled={loading} onClick={handlePlaceOrder} className="px-4 py-2 rounded bg-indigo-600">
            {loading ? 'Placing order...' : 'Place order (no payment integration yet)'}
          </button>
        </div>
      </main>
    </>
  )
}
