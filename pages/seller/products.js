// pages/seller/products.js
import React, { useEffect, useState } from 'react'
import SellerLayout from '../../components/SellerLayout'
import { supabase } from '../../lib/supabaseClient'

export default function SellerProductsPage() {
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', price: '', description: '', category_id: '' })
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user ?? null
      if (mounted) setUser(u)
      if (u) loadProducts(u.id)
    })
    return () => { mounted = false }
  }, [])

  async function loadProducts(uid) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', uid)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('load products', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddEdit(e) {
    e?.preventDefault()
    if (!user) return
    setBusy(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        price: Number(form.price || 0),
        category_id: form.category_id ? Number(form.category_id) : null,
        seller_id: user.id,
        is_active: true,
      }

      if (editing) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert(payload)
        if (error) throw error
      }

      setForm({ title: '', price: '', description: '', category_id: '' })
      setEditing(null)
      await loadProducts(user.id)
    } catch (err) {
      console.error('save product', err)
      alert('Failed: ' + (err.message || JSON.stringify(err)))
    } finally {
      setBusy(false)
    }
  }

  function startEdit(p) {
    setEditing(p)
    setForm({ title: p.title || '', price: p.price || '', description: p.description || '', category_id: p.category_id || '' })
  }

  async function handleDelete(p) {
    if (!confirm('Delete this product?')) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', p.id)
      if (error) throw error
      await loadProducts(user.id)
    } catch (err) {
      console.error('delete product', err)
      alert('Delete failed: ' + (err.message || JSON.stringify(err)))
    }
  }

  return (
    <SellerLayout title="Products">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your products</h2>
          <button onClick={() => { setEditing(null); setForm({ title: '', price: '', description: '', category_id: '' }) }} className="px-3 py-2 rounded bg-amber-500 text-slate-900">New product</button>
        </div>

        <form onSubmit={handleAddEdit} className="bg-slate-800/60 p-4 rounded mb-6 grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="p-2 rounded bg-slate-900/60" required />
            <input placeholder="Price" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="p-2 rounded bg-slate-900/60" required />
          </div>
          <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="p-2 rounded bg-slate-900/60" />
          <div className="flex gap-2">
            <button disabled={busy} type="submit" className="px-3 py-2 rounded bg-emerald-500 text-slate-900">{editing ? 'Save product' : 'Add product'}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm({ title: '', price: '', description: '', category_id: '' }) }} className="px-3 py-2 rounded border">Cancel</button>}
          </div>
        </form>

        {loading ? <div>Loading...</div> : (
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="bg-slate-800/60 p-3 rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-slate-400">₹{Number(p.price || 0).toFixed(2)} · ID: {p.id}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(p)} className="px-2 py-1 rounded bg-indigo-600 text-sm">Edit</button>
                  <button onClick={() => handleDelete(p)} className="px-2 py-1 rounded bg-red-600 text-sm">Delete</button>
                </div>
              </div>
            ))}
            {products.length === 0 && <div className="text-slate-400">You have no products yet.</div>}
          </div>
        )}
      </div>
    </SellerLayout>
  )
}
