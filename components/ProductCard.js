// components/ProductCard.js
import Link from 'next/link'

export default function ProductCard({ product }) {
  const minPrice = (() => {
    const v = (product.product_variants || []).map(x => Number(x.price || 0))
    return v.length ? Math.min(...v) : null
  })()

  return (
    <div className="border rounded p-4 bg-white/5">
      <h3 className="text-lg font-semibold">{product.title}</h3>
      <p className="text-sm text-gray-300 mt-2">{product.description}</p>
      <div className="mt-3 text-sm">
        {minPrice !== null ? <span>From ₹{minPrice}</span> : <span>Price unavailable</span>}
      </div>
      <div className="mt-4">
        <Link href={`/products/${product.id}`}><a className="text-indigo-500 underline">View</a></Link>
      </div>
    </div>
  )
}
