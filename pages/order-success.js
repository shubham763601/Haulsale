// pages/order-success.js
import { useRouter } from 'next/router'
import NavBar from '../components/NavBar'

export default function OrderSuccess() {
  const router = useRouter()
  const { order_id } = router.query

  return (
    <>
      <NavBar />
      <main className="min-h-screen p-8 bg-gray-900 text-white">
        <div className="max-w-lg mx-auto bg-white/5 p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-4">Order placed successfully 🎉</h1>

          {order_id ? (
            <p className="mb-4">Your order ID is: <span className="font-mono">{order_id}</span></p>
          ) : (
            <p className="mb-4">Loading order details…</p>
          )}

          <button
            onClick={() => router.push('/products')}
            className="mt-4 px-4 py-2 bg-indigo-600 rounded"
          >
            Browse more products
          </button>
        </div>
      </main>
    </>
  )
}
