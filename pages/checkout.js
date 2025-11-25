// pages/checkout.js
import React, { useContext, useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import { CartContext } from '../lib/cartContext'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Checkout() {
  const { items, total, clear } = useContext(CartContext)
  const [user, setUser] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data?.session?.user ?? null))
  }, [])

  async function handleCreateOrder() {
    setError(null)
    if (!user) return router.push('/auth/login')

    setBusy(true)
    try {
      const resp = await fetch('/api/proxy-create-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items })
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json?.error || 'Order API failed')
      clear()
      router.push(`/order-success?order_id=${json.order_id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen p-8 bg-gray-900 text-white">
        <section className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Checkout</h1>
          <div className="bg-white/5 p-6 rounded">
            <p>Order total: ₹{total.toFixed(2)}</p>
            {error && <p className="text-red-400">{error}</p>}
            <button className="mt-4 px-4 py-2 bg-green-600 rounded" onClick={handleCreateOrder} disabled={busy}>
              {busy ? 'Creating order...' : 'Place order'}
            </button>
          </div>
        </section>
      </main>
    </>
  )
}
