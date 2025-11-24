// pages/cart.js
import React, { useContext } from 'react'
import NavBar from '../components/NavBar'
import { CartContext } from '../lib/cartContext'
import Link from 'next/link'

export default function CartPage() {
  const { items, updateQty, removeItem, total, clear } = useContext(CartContext)

  return (
    <>
      <NavBar />
      <main className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Your cart</h1>
        {items.length === 0 ? (
          <div>
            <p>Your cart is empty</p>
            <Link href="/products"><a className="text-indigo-500 underline">Browse products</a></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(it => (
              <div key={it.variant_id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-sm text-gray-400">SKU: {it.sku}</div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" min="1" value={it.qty} onChange={e => updateQty(it.variant_id, Number(e.target.value))} className="w-20 px-2 py-1 border rounded" />
                  <div>₹{it.price * it.qty}</div>
                  <button onClick={() => removeItem(it.variant_id)} className="px-2 py-1 text-red-400">Remove</button>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center">
              <div>
                <button onClick={() => clear()} className="px-3 py-2 rounded bg-gray-700">Clear cart</button>
              </div>
              <div>
                <div className="text-lg font-semibold">Total: ₹{total}</div>
                <Link href="/checkout"><a className="px-4 py-2 rounded bg-green-600 inline-block mt-2">Proceed to checkout</a></Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
