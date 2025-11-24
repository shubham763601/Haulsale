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
      if (data?.product_variants?.length) setSelectedVariant(data.product_variants[0])
    } catch (err) {
      console.error('load product', err)
    } finally {
      setLoading(false)
    }
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
        <p className="text-gray-300 mt-2">{product.description}</p>

        <div className="mt-4">
          <label className="block text-sm text-gray-300">Variants</label>
          <select className="mt-1 block border rounded px-3 py-2" value={selectedVariant?.id || ''} onChange={e => {
            const v = product.product_variants.find(x => String(x.id) === String(e.target.value))
            setSelectedVariant(v)
          }}>
            {product.product_variants.map(v => <option key={v.id} value={v.id}>{v.sku || `Variant ${v.id}`} — ₹{v.price} — Stock: {v.stock}</option>)}
          </select>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label>Qty</label>
          <input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-20 px-2 py-1 border rounded" />
        </div>

        <div className="mt-6">
          <button onClick={() => {
            if (!selectedVariant) return
            addItem({...selectedVariant, product_id: product.id, product_title: product.title}, qty)
            router.push('/cart')
          }} className="px-4 py-2 rounded bg-indigo-600">Add to cart</button>
        </div>
      </main>
    </>
  )
}
