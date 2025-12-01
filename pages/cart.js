// pages/cart.js
import Head from 'next/head'
import { useRouter } from 'next/router'
import NavBar from '../components/NavBar'
import { useCart } from '../context/CartContext'

export default function CartPage() {
  const router = useRouter()
  const { items, updateQty, removeItem, clearCart, subtotal } = useCart()

  const hasItems = items && items.length > 0

  function handleCheckout() {
    if (!hasItems) return
    // ✅ No alert, just go to checkout
    router.push('/checkout')
  }

  return (
    <>
      <Head>
        <title>Cart – Haullcell</title>
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavBar />

        <main className="flex-1 mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-6">
          <h1 className="text-xl font-semibold text-slate-900 mb-4">
            Your cart
          </h1>

          {!hasItems && (
            <div className="rounded-xl bg-white border border-slate-200 p-6 text-sm text-slate-600">
              Your cart is empty. Browse products and add items to place an
              order.
            </div>
          )}

          {hasItems && (
            <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
              {/* Items list */}
              <div className="rounded-xl bg-white border border-slate-200 divide-y">
                {items.map((item) => (
                  <div
                    key={`${item.product_id}-${item.variant_id || 'default'}`}
                    className="flex gap-4 p-4"
                  >
                    <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">
                          No image
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="text-sm font-medium text-slate-900 line-clamp-2">
                            {item.title}
                          </h2>
                          {item.stock != null && (
                            <p className="text-xs text-slate-500">
                              Stock: {item.stock}
                            </p>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                          ₹{(item.price * item.qty).toFixed(2)}
                        </div>
                      </div>

                      {/* Qty controls */}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="inline-flex items-center border rounded-md bg-white">
                          <button
                            className="px-2 py-1 text-sm"
                            onClick={() =>
                              updateQty(
                                item.product_id,
                                item.variant_id,
                                Math.max(1, item.qty - 1)
                              )
                            }
                          >
                            –
                          </button>
                          <div className="px-3 py-1 text-sm border-x">
                            {item.qty}
                          </div>
                          <button
                            className="px-2 py-1 text-sm"
                            onClick={() =>
                              updateQty(
                                item.product_id,
                                item.variant_id,
                                item.qty + 1
                              )
                            }
                          >
                            +
                          </button>
                        </div>

                        <button
                          className="text-xs text-rose-500 hover:text-rose-600"
                          onClick={() =>
                            removeItem(item.product_id, item.variant_id)
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <aside className="rounded-xl bg-white border border-slate-200 p-4 h-fit">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                  Price details
                </h2>
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Shipping</span>
                  <span className="text-emerald-600">Free</span>
                </div>
                <div className="border-t border-slate-200 mt-2 pt-3 flex justify-between font-semibold text-sm">
                  <span>Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                <button
                  className="mt-4 w-full rounded-lg bg-emerald-600 text-white py-2.5 text-sm font-semibold hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  onClick={handleCheckout}
                  disabled={!hasItems}
                >
                  Proceed to checkout
                </button>

                <button
                  className="mt-2 w-full text-xs text-slate-500 hover:text-slate-700"
                  onClick={clearCart}
                >
                  Clear cart
                </button>
              </aside>
            </div>
          )}
        </main>
      </div>
    </>
  )
}