// pages/seller/products/new.js
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import SellerLayout from '../../../components/SellerLayout'
import { supabase } from '../../../lib/supabaseClient'

const EDGE_URL = process.env.NEXT_PUBLIC_CREATE_PRODUCT_URL || ''

export default function SellerAddProductPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [categoryImages, setCategoryImages] = useState([])
  const [selectedCategoryImageIds, setSelectedCategoryImageIds] = useState([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const [variantRows, setVariantRows] = useState([
    { id: 1, sku: '', price: '', stock: '', moq: '' },
  ])

  const [uploadFiles, setUploadFiles] = useState([])
  const [uploadedImages, setUploadedImages] = useState([]) // { storage_path, public_url }

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  useEffect(() => {
    let mounted = true

    async function init() {
      // Get current user
      const { data } = await supabase.auth.getSession()
      const u = data?.session?.user ?? null
      if (!mounted) return
      setUser(u)

      if (!u) {
        setError('You must be signed in as a seller to create products.')
        return
      }

      // load categories
      await loadCategories()
    }

    init()
    return () => {
      mounted = false
    }
  }, [])

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, main_image')
        .order('name', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('loadCategories', err)
      setError('Failed to load categories')
    }
  }

  async function loadCategoryImages(catId) {
    try {
      const { data, error } = await supabase
        .from('category_images')
        .select('id, storage_path, alt_text, position')
        .eq('category_id', catId)
        .order('position', { ascending: true })

      if (error) throw error
      setCategoryImages(data || [])
      setSelectedCategoryImageIds([])
    } catch (err) {
      console.error('loadCategoryImages', err)
      setError('Failed to load category images')
    }
  }

  function toggleCategoryImage(id) {
    setSelectedCategoryImageIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function updateVariantRow(rowId, field, value) {
    setVariantRows((rows) =>
      rows.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    )
  }

  function addVariantRow() {
    setVariantRows((rows) => [
      ...rows,
      { id: Date.now(), sku: '', price: '', stock: '', moq: '' },
    ])
  }

  function removeVariantRow(rowId) {
    setVariantRows((rows) => rows.filter((r) => r.id !== rowId))
  }

  async function handleUploadFiles() {
    if (!user) {
      setError('You must be signed in.')
      return
    }
    if (!uploadFiles.length) {
      setInfo('No files selected to upload.')
      return
    }

    setBusy(true)
    setError(null)
    setInfo(null)

    try {
      const uploaded = []

      for (const file of uploadFiles) {
        const cleanName = file.name.replace(/\s+/g, '_')
        const path = `products/${user.id}/${Date.now()}_${cleanName}`

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (error) throw error

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(path)

        uploaded.push({
          storage_path: path,
          public_url: urlData.publicUrl,
        })
      }

      setUploadedImages((prev) => [...prev, ...uploaded])
      setInfo(`Uploaded ${uploaded.length} image(s)`)
      setUploadFiles([])
    } catch (err) {
      console.error('upload product images', err)
      setError('Failed to upload images')
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    setError(null)
    setInfo(null)

    if (!user) {
      setError('You must be signed in.')
      return
    }
    if (!EDGE_URL) {
      setError('Missing NEXT_PUBLIC_CREATE_PRODUCT_URL env variable')
      return
    }
    if (!selectedCategoryId) {
      setError('Please select a category')
      return
    }
    if (!title.trim()) {
      setError('Please enter a product title')
      return
    }

    // Prepare variants
    const variants = variantRows
      .map((r) => ({
        sku: r.sku?.trim(),
        price: Number(r.price || 0),
        stock: Number(r.stock || 0),
        moq: r.moq ? Number(r.moq) : 1,
      }))
      .filter((v) => v.sku && !Number.isNaN(v.price))

    if (!variants.length) {
      setError('Add at least one variant with a SKU and price')
      return
    }

    // Prepare images payload
    const selectedCatImgs = categoryImages.filter((img) =>
      selectedCategoryImageIds.includes(img.id)
    )

    const images = []
    let pos = 0

    for (const img of selectedCatImgs) {
      images.push({
        storage_path: img.storage_path,
        alt_text: img.alt_text || title,
        position: pos++,
      })
    }

    for (const up of uploadedImages) {
      images.push({
        storage_path: up.storage_path,
        alt_text: title,
        position: pos++,
      })
    }

    setBusy(true)

    try {
      // Get session token
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) {
        setError('Please sign in again.')
        setBusy(false)
        return
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category_id: selectedCategoryId,
        variants,
        images,
      }

      const resp = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const json = await resp.json().catch(() => ({}))

      if (!resp.ok) {
        console.error('create-product error', json)
        setError(json.error || 'Failed to create product')
        return
      }

      setInfo('Product created successfully')
      // redirect back to product list after a short delay
      setTimeout(() => {
        router.push('/seller/products')
      }, 800)
    } catch (err) {
      console.error('submit product', err)
      setError('Unexpected error while creating product')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SellerLayout title="Add product">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create new product</h2>
          <button
            type="button"
            onClick={() => router.push('/seller/products')}
            className="text-sm text-slate-300 underline"
          >
            Back to products
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-sm text-red-100 rounded p-3">
            {error}
          </div>
        )}
        {info && (
          <div className="bg-emerald-900/40 border border-emerald-700 text-sm text-emerald-100 rounded p-3">
            {info}
          </div>
        )}

        {/* Category selection */}
        <section className="bg-slate-800/60 rounded p-4">
          <h3 className="font-medium mb-2">Category</h3>
          <p className="text-xs text-slate-400 mb-3">
            Choose the product category. This will also load default images for this category.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(c.id)
                  loadCategoryImages(c.id)
                }}
                className={`border rounded p-2 flex flex-col items-center gap-2 text-xs ${
                  selectedCategoryId === c.id
                    ? 'border-amber-400 bg-amber-500/10'
                    : 'border-slate-700 bg-slate-900/50'
                }`}
              >
                {c.main_image ? (
                  <img
                    src={c.main_image}
                    alt={c.name}
                    className="h-12 w-12 object-cover rounded-full"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
                    {c.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <span>{c.name}</span>
              </button>
            ))}
            {categories.length === 0 && (
              <div className="text-sm text-slate-400 col-span-full">
                No categories found. Ask admin to create categories.
              </div>
            )}
          </div>
        </section>

        {/* Product details */}
        <section className="bg-slate-800/60 rounded p-4 space-y-3">
          <h3 className="font-medium mb-2">Product details</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Title</label>
              <input
                className="w-full p-2 rounded bg-slate-900/60 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Premium Basmati Rice 1kg"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-300 block mb-1">Description</label>
            <textarea
              className="w-full p-2 rounded bg-slate-900/60 text-sm min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description, quality, usage, brand, etc."
            />
          </div>
        </section>

        {/* Category images suggestion */}
        <section className="bg-slate-800/60 rounded p-4 space-y-3">
          <h3 className="font-medium mb-2">Category suggested images</h3>
          <p className="text-xs text-slate-400">
            These are generic images for this category. You can attach them to this product.
          </p>
          <div className="flex flex-wrap gap-3">
            {categoryImages.map((img) => {
              const selected = selectedCategoryImageIds.includes(img.id)
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => toggleCategoryImage(img.id)}
                  className={`border rounded overflow-hidden relative ${
                    selected ? 'border-amber-400' : 'border-slate-700'
                  }`}
                >
                  <div className="h-16 w-16 bg-slate-700 flex items-center justify-center text-[10px]">
                    <span>{img.storage_path}</span>
                  </div>
                  {selected && (
                    <div className="absolute inset-0 bg-amber-500/20 border-2 border-amber-400 pointer-events-none" />
                  )}
                </button>
              )
            })}
            {categoryImages.length === 0 && (
              <div className="text-xs text-slate-400">
                No extra images defined for this category. (Admin can add them in category_images.)
              </div>
            )}
          </div>
        </section>

        {/* Upload product images */}
        <section className="bg-slate-800/60 rounded p-4 space-y-3">
          <h3 className="font-medium mb-2">Upload product images</h3>
          <p className="text-xs text-slate-400">
            Upload real photos of this product (up to a few images). They will be stored in the
            &quot;product-images&quot; bucket.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="file"
              multiple
              onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
              className="text-xs"
            />
            <button
              type="button"
              onClick={handleUploadFiles}
              disabled={busy || !uploadFiles.length}
              className="px-3 py-1.5 rounded bg-indigo-500 text-xs font-medium disabled:opacity-60"
            >
              {busy ? 'Uploading...' : 'Upload selected'}
            </button>
          </div>
          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2">
              {uploadedImages.map((img, idx) => (
                <div key={idx} className="border border-slate-700 rounded p-1 text-[10px]">
                  <div className="h-16 w-16 bg-slate-700 flex items-center justify-center mb-1">
                    {img.public_url ? (
                      <img
                        src={img.public_url}
                        alt="uploaded"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>img</span>
                    )}
                  </div>
                  <div className="w-24 break-all">{img.storage_path}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Variants */}
        <section className="bg-slate-800/60 rounded p-4 space-y-3">
          <h3 className="font-medium mb-2">Variants (SKU / price / stock / MOQ)</h3>
          <p className="text-xs text-slate-400">
            Add different packs or options, e.g. 1kg, 5kg, carton, etc.
          </p>

          <div className="space-y-2">
            {variantRows.map((row, idx) => (
              <div
                key={row.id}
                className="grid grid-cols-5 gap-2 items-center bg-slate-900/40 p-2 rounded"
              >
                <input
                  className="p-1 text-xs rounded bg-slate-900/80"
                  placeholder="Variant title / SKU"
                  value={row.sku}
                  onChange={(e) => updateVariantRow(row.id, 'sku', e.target.value)}
                />
                <input
                  className="p-1 text-xs rounded bg-slate-900/80"
                  placeholder="Price"
                  type="number"
                  value={row.price}
                  onChange={(e) => updateVariantRow(row.id, 'price', e.target.value)}
                />
                <input
                  className="p-1 text-xs rounded bg-slate-900/80"
                  placeholder="Stock"
                  type="number"
                  value={row.stock}
                  onChange={(e) => updateVariantRow(row.id, 'stock', e.target.value)}
                />
                <input
                  className="p-1 text-xs rounded bg-slate-900/80"
                  placeholder="MOQ"
                  type="number"
                  value={row.moq}
                  onChange={(e) => updateVariantRow(row.id, 'moq', e.target.value)}
                />
                <div className="flex justify-end">
                  {variantRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariantRow(row.id)}
                      className="text-[11px] text-red-300 underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addVariantRow}
            className="mt-2 px-3 py-1.5 rounded bg-slate-900 text-xs border border-slate-600"
          >
            + Add another variant
          </button>
        </section>

        {/* Submit */}
        <section className="flex justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-emerald-500 text-slate-900 font-medium disabled:opacity-60"
          >
            {busy ? 'Creating product...' : 'Create product'}
          </button>
        </section>
      </div>
    </SellerLayout>
  )
}
