// pages/checkout.js
import React, { useContext, useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import { CartContext } from '../lib/cartContext'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Checkout() {
  const { items, total, clear } = useContext(CartContext)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function loadSession() {
      const session = await supabase.auth.getSession()
      setUser(session.data.session?.user ?? null)
      setToken(session.data.session?.access_token ?? null)
    }
    loadSession()
  }, [])

  async function handleCreateOrder() {
    setError(null)

    if (!user) return router.push('/auth/login')
    if (!token) {
      setError("Missing auth token")
      return
    }

    setBusy(true)
    try {
      const resp = await fetch('/api/proxy-create-order', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`   // ⭐ CRITICAL FIX
        },
        body: JSON.stringify({ items })
      })

      const text = await resp.text()
      let json = {}
      try { json = JSON.parse(text) } catch {}

      if (!resp.ok) {
        throw new Error(json?.error || json?.message || "Order API failed")
      }

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
            <button
              className="mt-4 px-4 py-2 bg-green-600 rounded"
              onClick={handleCreateOrder}
              disabled={busy}
            >
              {busy ? 'Creating order...' : 'Place order'}
            </button>
          </div>
        </section>
      </main>
    </>
  )
}
