// pages/seller/products/new.js
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../../lib/supabaseClient'
import SellerLayout from '../../../components/SellerLayout'

function classNames(...xs) {
  return xs.filter(Boolean).join(' ')
}

export default function SellerAddProductPage() {
  const router = useRouter()

  // ---- CATEGORY + FORM STATE ----
  const [categories, setCategories] = useState([])
  const [catError, setCatError] = useState(null)
  const [loadingCats, setLoadingCats] = useState(true)

  const [form, setForm] = useState({
    category_id: '',
    title: '',
    description: '',
    base_price: '',
    base_stock: '',
    is_active: true,
  })

  // ---- VARIANTS ----
  const [variants, setVariants] = useState([
    { id: 1, name: 'Default', sku: '', price: '', stock: '', moq: '' },
  ])

  // ---- MEDIA UPLOADS ----
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState([]) // {path, publicUrl, fileName}
  const [uploadError, setUploadError] = useState(null)

  // ---- SAVE / ERROR ----
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // ------------------- LOAD CATEGORIES -------------------
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
        setCatError(error.message || 'Failed to load categories')
        setCategories([])
      } else {
        setCategories(data || [])
      }
    } catch (err) {
      console.error('loadCategories exception:', err)
      setCatError(err.message || 'Failed to load categories')
      setCategories([])
    } finally {
      setLoadingCats(false)
    }
  }

  // ------------------- VARIANTS HELPERS -------------------
  function updateVariant(idx, field, value) {
    setVariants(prev => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  function addVariantRow() {
    setVariants(prev => [
      ...prev,
      { id: Date.now(), name: '', sku: '', price: '', stock: '', moq: '' },
    ])
  }

  function removeVariantRow(idx) {
    setVariants(prev => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)))
  }

  // ------------------- IMAGE UPLOAD -------------------
  async function handleFileChange(e) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadError(null)
    setUploading(true)

    const newImages = []

    try {
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase
          .storage
          .from('product-images')
          .upload(filePath, file)

        if (uploadError) {
          console.error('upload error', uploadError)
          throw uploadError
        }

        const { data: publicData } = supabase
          .storage
          .from('product-images')
          .getPublicUrl(filePath)

        newImages.push({
          path: filePath,
          publicUrl: publicData?.publicUrl || '',
          fileName: file.name,
        })
      }

      setUploadedImages(prev => [...prev, ...newImages])
    } catch (err) {
      console.error('upload exception', err)
      setUploadError(err.message || 'Failed to upload images')
    } finally {
      setUploading(false)
      // reset file input so same file can be selected again
      e.target.value = ''
    }
  }

  function removeUploadedImage(idx) {
    setUploadedImages(prev => prev.filter((_, i) => i !== idx))
  }

  // ------------------- SUBMIT HANDLER -------------------
  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)

    // Basic validation
    if (!form.title || !form.category_id) {
      setSaveError('Please fill title and category.')
      setSaving(false)
      return
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) {
        setSaveError('You must be signed in as seller.')
        setSaving(false)
        return
      }

      // Prepare variants: if all blank, create a single default from base fields
      let cleanedVariants = variants
        .map(v => ({
          name: v.name || 'Default',
          sku: v.sku || null,
          price: v.price ? Number(v.price) : (form.base_price ? Number(form.base_price) : null),
          stock: v.stock ? Number(v.stock) : (form.base_stock ? Number(form.base_stock) : 0),
          moq: v.moq ? Number(v.moq) : 1,
        }))
        .filter(v => v.price !== null)

      if (cleanedVariants.length === 0) {
        cleanedVariants = [{
          name: 'Default',
          sku: null,
          price: form.base_price ? Number(form.base_price) : 0,
          stock: form.base_stock ? Number(form.base_stock) : 0,
          moq: 1,
        }]
      }

      const payload = {
        product: {
          title: form.title,
          description: form.description || '',
          category_id: Number(form.category_id),
          base_price: form.base_price ? Number(form.base_price) : null,
          base_stock: form.base_stock ? Number(form.base_stock) : null,
          is_active: form.is_active,
        },
        variants: cleanedVariants,
        images: uploadedImages.map((img, idx) => ({
          storage_path: img.path,
          alt_text: form.title,
          position: idx + 1,
        })),
      }

      const resp = await fetch('../../../api/proxy-create-product', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const json = await resp.json().catch(() => ({}))

      if (!resp.ok) {
        console.error('create product error', json)
        throw new Error(json.error || json.message || 'Failed to create product')
      }

      // Success → go back to products list
      router.push('/seller/products')
    } catch (err) {
      console.error('create product exception', err)
      setSaveError(err.message || 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  // ------------------- RENDER -------------------
  return (
    <SellerLayout active="products">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT: Form */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">Add product</h1>
              <p className="text-sm text-slate-400">
                Create a new product, manage pricing, inventory and media.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/seller/products')}
              className="text-sm text-slate-300 hover:text-white underline"
            >
              Back to products
            </button>
          </div>

          {/* Error banners */}
          {catError && (
            <div className="rounded-lg border border-rose-500 bg-rose-900/60 px-4 py-3 text-sm text-rose-100">
              {catError}
            </div>
          )}
          {saveError && (
            <div className="rounded-lg border border-rose-500 bg-rose-900/60 px-4 py-3 text-sm text-rose-100">
              {saveError}
            </div>
          )}

          {/* Card: Product details */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-base font-semibold text-white">Product details</h2>
              <p className="mt-1 text-xs text-slate-400">
                Basic information for your product.
              </p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Title
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Basmati Rice 25kg"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Category
                  </label>
                  {loadingCats ? (
                    <div className="mt-1 text-xs text-slate-400">Loading categories…</div>
                  ) : categories.length === 0 ? (
                    <div className="mt-1 text-xs text-slate-400">
                      No categories found. Ask admin to create categories.
                    </div>
                  ) : (
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
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

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Status
                  </label>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    value={form.is_active ? 'active' : 'inactive'}
                    onChange={e =>
                      setForm(f => ({ ...f, is_active: e.target.value === 'active' }))
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Draft</option>
                  </select>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    value={form.description}
                    onChange={e =>
                      setForm(f => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Describe the product, pack size, usage, etc."
                  />
                </div>
              </div>
            </section>

            {/* Card: Media */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-base font-semibold text-white">Media</h2>
              <p className="mt-1 text-xs text-slate-400">
                Upload images that best represent this product.
              </p>

              <div className="mt-4">
                <label
                  className={classNames(
                    'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center text-xs',
                    uploading
                      ? 'border-slate-500 bg-slate-900/80 text-slate-300'
                      : 'border-slate-600 bg-slate-900/60 text-slate-400 hover:border-indigo-500 hover:text-indigo-300 cursor-pointer'
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <span className="font-medium">
                    Click to upload or drag and drop
                  </span>
                  <span className="mt-1 text-[11px]">
                    PNG, JPG up to ~2MB each
                  </span>
                </label>

                {uploadError && (
                  <p className="mt-2 text-xs text-rose-300">{uploadError}</p>
                )}

                {uploadedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {uploadedImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-900"
                      >
                        {img.publicUrl ? (
                          <img
                            src={img.publicUrl}
                            alt={img.fileName}
                            className="h-24 w-full object-cover"
                          />
                        ) : (
                          <div className="h-24 flex items-center justify-center text-[11px] text-slate-400">
                            Uploaded
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(idx)}
                          className="absolute top-1 right-1 rounded-full bg-slate-900/80 px-2 text-[10px] text-slate-100 opacity-0 group-hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Card: Pricing & Inventory */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-base font-semibold text-white">Pricing & inventory</h2>
              <p className="mt-1 text-xs text-slate-400">
                Base price and stock if you don&apos;t want advanced variants yet.
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Base price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    value={form.base_price}
                    onChange={e =>
                      setForm(f => ({ ...f, base_price: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Base stock
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    value={form.base_stock}
                    onChange={e =>
                      setForm(f => ({ ...f, base_stock: e.target.value }))
                    }
                  />
                </div>
              </div>
            </section>

            {/* Card: Variants */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base font-semibold text-white">Variants</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Optional. Add pack sizes, flavours, or MOQ-based pricing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addVariantRow}
                  className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-indigo-600"
                >
                  + Add variant
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {variants.map((v, idx) => (
                  <div
                    key={v.id}
                    className="grid grid-cols-1 sm:grid-cols-6 gap-3 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3"
                  >
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-300">
                        Name
                      </label>
                      <input
                        className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        value={v.name}
                        onChange={e =>
                          updateVariant(idx, 'name', e.target.value)
                        }
                        placeholder="e.g. 50kg bag"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300">
                        SKU
                      </label>
                      <input
                        className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        value={v.sku}
                        onChange={e =>
                          updateVariant(idx, 'sku', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        value={v.price}
                        onChange={e =>
                          updateVariant(idx, 'price', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300">
                        Stock
                      </label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        value={v.stock}
                        onChange={e =>
                          updateVariant(idx, 'stock', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300">
                        MOQ
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                          value={v.moq}
                          onChange={e =>
                            updateVariant(idx, 'moq', e.target.value)
                          }
                        />
                        <button
                          type="button"
                          disabled={variants.length === 1}
                          onClick={() => removeVariantRow(idx)}
                          className="text-[11px] text-slate-300 hover:text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-3 pb-6">
              <button
                type="button"
                onClick={() => router.push('/seller/products')}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || loadingCats || categories.length === 0}
                className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save product'}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: Summary card (like Stripe/Shopify sidebar) */}
        <aside className="w-full lg:w-80 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <h3 className="text-sm font-semibold text-white">Publish status</h3>
            <p className="mt-1 text-xs text-slate-400">
              Control whether buyers can see this product in the marketplace.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-950/60 px-3 py-2">
              <span className="text-xs text-slate-300">
                {form.is_active ? 'Active' : 'Draft'}
              </span>
              <span
                className={classNames(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                  form.is_active
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-700 text-slate-200'
                )}
              >
                ● {form.is_active ? 'Visible to buyers' : 'Hidden'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <h3 className="text-sm font-semibold text-white">Media status</h3>
            <p className="mt-1 text-xs text-slate-400">
              {uploadedImages.length === 0
                ? 'No images added yet.'
                : `${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''} uploaded.`}
            </p>
          </div>
        </aside>
      </div>
    </SellerLayout>
  )
}