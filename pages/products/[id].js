// pages/products/[id].js
import { useRouter } from 'next/router'
import React, { useEffect, useState, useContext } from 'react'
import { supabase } from '../../lib/supabaseClient'
import NavBar from '../../components/NavBar'
import { CartContext } from '../../lib/cartContext'

export default function ProductDetail() {
  const router = useRouter()
  const { id } = router.query
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [qty, setQty] = useState(1)
  const { addItem } = useContext(CartContext)

  useEffect(() => {
    if (!id) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function load() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      setProduct(data)
      if (data?.product_variants?.length) {
        setSelectedVariant(data.product_variants[0])
        setQty(1)
      } else {
        setSelectedVariant(null)
      }
    } catch (err) {
      console.error('load product', err)
      setProduct(null)
      setSelectedVariant(null)
    } finally {
      setLoading(false)
    }
  }

  function handleVariantChange(variantId) {
    const v = product.product_variants.find(x => String(x.id) === String(variantId))
    setSelectedVariant(v || null)
    setQty(1)
  }

  function clampQty(value) {
    const n = Number(value) || 1
    if (!selectedVariant) return 1
    if (selectedVariant.stock == null) return Math.max(1, n)
    return Math.max(1, Math.min(n, Number(selectedVariant.stock)))
  }

  function handleAddToCart() {
    if (!selectedVariant) {
      alert('Please select a variant before adding to cart.')
      return
    }
    const safeQty = clampQty(qty)
    if (selectedVariant.stock != null && safeQty > selectedVariant.stock) {
      alert(`Only ${selectedVariant.stock} units available for this variant.`)
      return
    }

    addItem(
      {
        id: selectedVariant.id,
        variant_id: selectedVariant.id,
        product_id: product.id,
        product_title: product.title,
        price: selectedVariant.price ?? 0,
        sku: selectedVariant.sku ?? ''
      },
      safeQty
    )

    alert('Added to cart')
    router.push('/cart')
  }

  if (loading) return <>
    <NavBar />
    <main className="p-6">Loading...</main>
  </>

  if (!product) return <>
    <NavBar />
    <main className="p-6">Product not found</main>
  </>

  return (
    <>
      <NavBar />
      <main className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">{product.title}</h1>
        {product.subtitle && <p className="text-sm text-gray-400">{product.subtitle}</p>}
        <p className="text-gray-300 mt-2">{product.description}</p>

        <div className="mt-4">
          <label className="block text-sm text-gray-300">Variants</label>

          {product.product_variants?.length ? (
            <select
              className="mt-1 block border rounded px-3 py-2 bg-gray-800 text-white"
              value={selectedVariant?.id ?? ''}
              onChange={e => handleVariantChange(e.target.value)}
            >
              {product.product_variants.map(v => (
                <option key={v.id} value={v.id}>
                  {v.sku || `Variant ${v.id}`} — ₹{v.price ?? '—'} — Stock: {v.stock ?? '—'}
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-2 text-yellow-300">No variants available</div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="text-sm text-gray-300">Qty</label>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={e => setQty(clampQty(e.target.value))}
            className="w-24 px-2 py-1 border rounded bg-gray-800 text-white"
          />

          {selectedVariant && (
            <div className="ml-4 text-sm text-gray-300">
              Price: <span className="font-semibold">₹{selectedVariant.price ?? '—'}</span>
              <div className="text-xs text-gray-500">Stock: {selectedVariant.stock ?? '—'}</div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || (selectedVariant && selectedVariant.stock === 0)}
            className={`px-4 py-2 rounded ${!selectedVariant || (selectedVariant && selectedVariant.stock === 0) ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {selectedVariant && selectedVariant.stock === 0 ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </main>
    </>
  )
}
