// pages/seller/products/new.js
import React, { useState, useEffect, useContext } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../../../lib/supabaseClient'
import SellerLayout from '../../../components/SellerLayout'
import UserContext from '../../../lib/userContext'

export default function SellerNewProductPage() {
  const router = useRouter()
  const { user } = useContext(UserContext)

  const [categories, setCategories] = useState([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('active')
  const [mrp, setMrp] = useState('') // 👈 NEW

  // images (just store storage paths coming from uploader)
  const [imagePaths, setImagePaths] = useState([])

  // simple variant array
  const [variants, setVariants] = useState([
    { sku: '', price: '', stock: '', moq: '' },
  ])

  useEffect(() => {
    async function loadCats() {
      setLoadingCats(true)
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('id', { ascending: true })

      if (error) {
        console.error(error)
        setError('Failed to load categories')
      } else {
        setCategories(data || [])
      }
      setLoadingCats(false)
    }
    loadCats()
  }, [])

  function updateVariant(idx, field, value) {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    )
  }

  function addVariantRow() {
    setVariants((prev) => [...prev, { sku: '', price: '', stock: '', moq: '' }])
  }

  function removeVariantRow(idx) {
    setVariants((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!user) {
      setError('You must be signed in as seller')
      return
    }
    if (!title || !categoryId || variants.length === 0) {
      setError('title, category and at least one variant are required')
      return
    }

    setSubmitting(true)
    try {
      const sessionRes = await supabase.auth.getSession()
      const token = sessionRes.data?.session?.access_token
      if (!token) {
        setError('Missing auth token, please re-login')
        setSubmitting(false)
        return
      }

      const payload = {
        title,
        description,
        category_id: Number(categoryId),
        status,
        mrp: mrp ? Number(mrp) : null,               // 👈 NEW
        images: imagePaths,                           // array of storage_path strings
        variants: variants
          .filter((v) => v.price && v.stock)
          .map((v) => ({
            sku: v.sku || null,
            price: Number(v.price),
            stock: Number(v.stock),
            moq: v.moq ? Number(v.moq) : null,
          })),
      }

      const resp = await fetch('/api/proxy-create-product', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const json = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        console.error('create product error', json)
        setError(json?.error || 'Failed to create product')
      } else {
        router.push('/seller/products')
      }
    } catch (err) {
      console.error(err)
      setError('Unexpected error creating product')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SellerLayout>
      <Head>
        <title>Add product — Seller</title>
      </Head>

      <div className="max-w-4xl mx-auto py-6 px-3 sm:px-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Add product</h1>
            <p className="text-sm text-slate-500">
              Create a new product, manage pricing, inventory and media.
            </p>
          </div>
          <button
            onClick={() => router.push('/seller/products')}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Back to products
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product details */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Product details
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600">
                  Title
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Aashirvaad Atta 50kg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600">
                  Category
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={loadingCats}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600">
                  Status
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* NEW MRP FIELD */}
              <div>
                <label className="block text-xs font-medium text-slate-600">
                  MRP (Max retail price)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="2000"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Used to show discount % like Flipkart.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">
                Description
              </label>
              <textarea
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[80px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key features, pack size, flavour, etc."
              />
            </div>
          </section>

          {/* Media – you already have uploader, keep your existing implementation */}
          {/* ======= replace this block with your real uploader UI if needed ======= */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Media</h2>
            <p className="text-xs text-slate-500">
              Right now this is a simple placeholder. Keep your previous uploader
              logic and just ensure it fills <code>imagePaths</code> with storage
              paths like <code>product-images/atta-50kg.jpg</code>.
            </p>
          </section>

          {/* Variants */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Variants</h2>
              <button
                type="button"
                onClick={addVariantRow}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                + Add variant
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 md:grid-cols-[1.3fr,1fr,1fr,1fr,auto] items-end border border-slate-100 rounded-lg p-3"
                >
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">
                      SKU / Label
                    </label>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                      value={v.sku}
                      onChange={(e) =>
                        updateVariant(idx, 'sku', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                      value={v.price}
                      onChange={(e) =>
                        updateVariant(idx, 'price', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">
                      Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                      value={v.stock}
                      onChange={(e) =>
                        updateVariant(idx, 'stock', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">
                      MOQ
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                      value={v.moq}
                      onChange={(e) =>
                        updateVariant(idx, 'moq', e.target.value)
                      }
                    />
                  </div>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariantRow(idx)}
                      className="text-xs text-red-500 hover:text-red-400 px-2 py-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push('/seller/products')}
              className="px-4 py-2 rounded-md border border-slate-200 text-sm text-slate-700 bg-white hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-md bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save product'}
            </button>
          </div>
        </form>
      </div>
    </SellerLayout>
  )
}
