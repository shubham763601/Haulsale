// pages/seller/products/new.js
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../../lib/supabaseClient' // <-- adjust ../ if needed
import SellerLayout from '../../../components/SellerLayout'

export default function SellerAddProductPage() {
  const router = useRouter()

  const [categories, setCategories] = useState([])
  const [catError, setCatError] = useState(null)
  const [loadingCats, setLoadingCats] = useState(true)

  // simple product form for now (we’ll extend later)
  const [form, setForm] = useState({
    category_id: '',
    title: '',
    description: '',
    price: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoadingCats(true)
    setCatError(null)
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) {
        console.error('loadCategories error:', error)
        setCatError('Failed to load categories: ' + (error.message || 'Unknown error'))
        setCategories([])
      } else {
        setCategories(data || [])
      }
    } catch (err) {
      console.error('loadCategories exception:', err)
      setCatError('Failed to load categories: ' + err.message)
      setCategories([])
    } finally {
      setLoadingCats(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)

    try {
      // we’ll wire this to edge function / variants later
      const { error } = await supabase.from('products').insert({
        title: form.title,
        description: form.description,
        price: form.price ? Number(form.price) : null,
        category_id: form.category_id ? Number(form.category_id) : null,
        // seller_id is set in the edge function or via trigger,
        // so we don’t set it directly here for now.
      })

      if (error) {
        console.error('create product error:', error)
        setSaveError(error.message || 'Failed to create product')
      } else {
        router.push('/seller/products')
      }
    } catch (err) {
      console.error('create product exception:', err)
      setSaveError(err.message || 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SellerLayout active="products">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Add product</h1>
          <p className="text-sm text-gray-400">
            Manage your store, products and orders
          </p>
        </div>
        <button
          className="text-sm text-indigo-300 hover:text-indigo-200 underline"
          onClick={() => router.push('/seller/products')}
        >
          Back to products
        </button>
      </div>

      {/* Categories load error */}
      {catError && (
        <div className="mb-4 rounded bg-red-900/60 border border-red-500 px-4 py-3 text-sm text-red-100">
          {catError}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/70 rounded-xl p-6 border border-slate-800 max-w-2xl"
      >
        {/* Category */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Category
          </label>

          {loadingCats ? (
            <div className="text-sm text-gray-400">Loading categories…</div>
          ) : categories.length === 0 ? (
            <div className="text-sm text-gray-400">
              No categories found. Ask admin to create categories.
            </div>
          ) : (
            <select
              className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
              value={form.category_id}
              onChange={e =>
                setForm(f => ({ ...f, category_id: e.target.value }))
              }
              required
            >
              <option value="">Select category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Title */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Title
          </label>
          <input
            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
            value={form.title}
            onChange={e =>
              setForm(f => ({ ...f, title: e.target.value }))
            }
            required
          />
        </div>

        {/* Description */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Description
          </label>
          <textarea
            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
            rows={3}
            value={form.description}
            onChange={e =>
              setForm(f => ({ ...f, description: e.target.value }))
            }
          />
        </div>

        {/* Price */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Price
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
            value={form.price}
            onChange={e =>
              setForm(f => ({ ...f, price: e.target.value }))
            }
          />
        </div>

        {saveError && (
          <div className="mb-4 text-sm text-red-300">
            {saveError}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || loadingCats || categories.length === 0}
          className="inline-flex items-center px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white disabled:bg-slate-700 disabled:cursor-not-allowed"
        >
          {saving ? 'Creating...' : 'Create product'}
        </button>
      </form>
    </SellerLayout>
  )
}