// pages/cart.js
import React, { useContext, useState } from 'react'
import NavBar from '../components/NavBar'
import { CartContext } from '../lib/cartContext'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function CartPage() {
  const { items, updateQty, removeItem, total, clear } = useContext(CartContext)
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleProceed() {
    setError(null)
    if (!items.length) return setError('Cart is empty')
    router.push('/checkout')
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen p-8 bg-gray-900 text-white">
        <section className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Your cart</h1>

          {items.length === 0 ? (
            <div className="bg-white/5 p-6 rounded">
              <p>Your cart is empty.</p>
              <Link href="/products"><a className="text-indigo-400 underline mt-3 inline-block">Browse products</a></Link>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {items.map(it => (
                  <div key={it.variant_id} className="flex items-center justify-between p-4 bg-white/5 rounded">
                    <div>
                      <div className="font-semibold">{it.title}</div>
                      <div className="text-sm text-gray-300">SKU: {it.sku}</div>
                    </div>

                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min="1"
                        value={it.qty}
                        onChange={e => updateQty(it.variant_id, Number(e.target.value))}
                        className="w-20 px-2 py-1 rounded text-black"
                      />
                      <div className="font-medium">₹{(Number(it.price) * Number(it.qty)).toFixed(2)}</div>
                      <button onClick={() => removeItem(it.variant_id)} className="px-3 py-1 rounded bg-red-600">Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => clear()} className="px-4 py-2 rounded bg-gray-700">Clear cart</button>
                  <Link href="/products"><a className="px-4 py-2 rounded border">Continue shopping</a></Link>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-300">Total</div>
                  <div className="text-2xl font-bold mb-2">₹{total.toFixed(2)}</div>
                  {error && <div className="text-red-400 mb-2">{error}</div>}
                  <div className="flex gap-3 justify-end">
                    <button onClick={handleProceed} disabled={busy} className="px-4 py-2 rounded bg-green-600">
                      {busy ? 'Processing...' : 'Proceed to checkout'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  )
}
