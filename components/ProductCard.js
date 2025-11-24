// components/ProductCard.js
import Link from 'next/link'

export default function ProductCard({ product }) {
  const minPrice = (() => {
    if (!product?.product_variants || !product.product_variants.length) return null
    return Math.min(...product.product_variants.map(v => Number(v.price || 0)))
  })()

  return (
    <div className="border rounded p-4 bg-white/5">
      <h3 className="text-lg font-semibold">{product.title}</h3>
      {product.description && <p className="text-sm text-gray-300 mt-2">{product.description}</p>}
      <div className="mt-3 text-sm">
        {minPrice !== null ? <span>From ₹{minPrice}</span> : <span>Price unavailable</span>}
      </div>
      <div className="mt-4">
        <Link href={product?.id ? `/products/${product.id}` : '/products'}>
          <a className="text-indigo-500 underline">View</a>
        </Link>
      </div>
    </div>
  )
}
