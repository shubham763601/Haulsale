// pages/checkout.js
import React, { useContext, useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import { CartContext } from '../lib/cartContext'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

/**
 * Try to POST to the Netlify function first (if deployed),
 * otherwise fall back to the Next.js proxy which calls the Supabase Edge function.
 */
async function callOrderService(body) {
  const endpoints = [
    '/.netlify/functions/create-order', // Netlify function (if using Netlify)
    '/api/proxy-create-order'           // Next.js proxy (Vercel / fallback)
  ]

  let lastError = null
  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      // read text first (robust for non-JSON or empty responses)
      const text = await resp.text()
      if (!text) {
        if (resp.ok) return { ok: true, data: null, status: resp.status }
        lastError = { status: resp.status, body: 'empty response' }
        continue
      }

      // attempt parse JSON
      try {
        const json = JSON.parse(text)
        if (resp.ok) return { ok: true, data: json, status: resp.status }
        // non-2xx JSON response (bubble up error)
        lastError = { status: resp.status, body: json }
        continue
      } catch (e) {
        // not JSON - if successful status, return raw text; otherwise treat as error
        if (resp.ok) return { ok: true, data: text, status: resp.status }
        lastError = { status: resp.status, body: text }
        continue
      }
    } catch (err) {
      // network or fetch failure — remember and try next
      lastError = { error: String(err) }
      continue
    }
  }
  return { ok: false, error: lastError }
}

export default function Checkout() {
  const { items, total, clear } = useContext(CartContext)
  const [user, setUser] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUser(data?.session?.user ?? null)
    }).catch(() => {
      if (!mounted) return
      setUser(null)
    })
    return () => { mounted = false }
  }, [])

  async function handleCreateOrder() {
    setError(null)
    if (!user) return router.push('/auth/login')

    if (!items || items.length === 0) {
      setError('Cart is empty')
      return
    }

    setBusy(true)
    try {
      // build payload with buyer id and items
      const body = {
        buyer_id: user?.id ?? null,
        items: items.map(i => ({
          variant_id: i.variant_id ?? i.id,
          product_id: i.product_id,
          price: i.price,
          qty: i.qty,
          sku: i.sku ?? null
        }))
      }

      const result = await callOrderService(body)

      if (!result.ok) {
        // build helpful error message
        const e = result.error
        let msg = 'Order API failed'
        if (e) {
          if (e.body) {
            try {
              // if body is JSON-like, stringify it nicely
              msg = typeof e.body === 'object' ? JSON.stringify(e.body) : String(e.body)
            } catch {
              msg = String(e.body)
            }
          } else if (e.error) msg = String(e.error)
          else if (e.status) msg = `Status ${e.status}`
        }
        throw new Error(msg)
      }

      // success - result.data might be JSON or text
      const resData = result.data
      const orderId = resData?.order_id ?? (typeof resData === 'string' ? resData : null)

      // clear cart and navigate to success (if we have an order id)
      clear()
      if (orderId) {
        router.push(`/order-success?order_id=${orderId}`)
      } else {
        // fallback: show a small success message and send user to orders page
        router.push('/account')
      }
    } catch (err) {
      console.error('create order error ->', err)
      setError(err.message || 'Order API failed')
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
            <p>Order total: ₹{Number(total || 0).toFixed(2)}</p>
            {error && <p className="text-red-400 mt-2">{error}</p>}
            <button
              className="mt-4 px-4 py-2 bg-green-600 rounded disabled:opacity-60"
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
