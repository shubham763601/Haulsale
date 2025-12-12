// components/seller/ProductForm.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const BUCKET = process.env.NEXT_PUBLIC_PRODUCT_IMAGES_BUCKET || 'product-images';

export default function ProductForm({ product = null, onClose = () => {} }) {
  const [form, setForm] = useState({ title: '', description: '', price: '', mrp: '', category_id: '', is_active: false });
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    })();
    if (product) {
      setForm({
        title: product.title || '',
        description: product.description || '',
        price: product.price ?? '',
        mrp: product.mrp ?? '',
        category_id: product.category_id ?? '',
        is_active: product.is_active ?? false
      });
      setVariants(product.product_variants || []);
      setImages(product.product_images || []);
    } else {
      setVariants([]);
      setImages([]);
    }
  }, [product]);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function addVariant() { setVariants(v => [...v, { price: '', stock: '', moq: '', sku: '' }]); }
  function updateVariant(i,k,v) { const c = [...variants]; c[i][k] = v; setVariants(c); }
  function removeVariant(i) { setVariants(v => v.filter((_, idx) => idx !== i)); }

  async function saveDraft() {
    setSaving(true);
    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const url = product?.id ? `/api/seller/products/${product.id}` : '/api/seller/products';
      const method = product?.id ? 'PUT' : 'POST';
      const payload = { ...form, product_variants: variants };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Save failed');
      }
      const json = await res.json();
      alert('Saved');
      onClose();
      return json.product;
    } catch (err) {
      console.error('saveDraft error', err);
      alert('Save failed: ' + (err.message || err));
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function uploadImageFile(file) {
    try {
      if (!user) throw new Error('Please sign in');
      let productId = product?.id;
      if (!productId) {
        const created = await saveDraft();
        productId = created?.id;
        if (!productId) return;
      }

      const filename = `${productId}/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const { data: up, error: upErr } = await supabase.storage.from(BUCKET).upload(filename, file);
      if (upErr) throw upErr;

      // call server to insert metadata (server endpoint uses service role)
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const resp = await fetch('/api/seller/product_images', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ product_id: productId, storage_path: up.path, alt_text: file.name, position: 0 }) });
      if (!resp.ok) throw new Error('Image metadata insert failed');

      const json = await resp.json();
      setImages(prev => [...prev, json.image]);
    } catch (err) {
      console.error('image upload error', err);
      alert('Image upload failed: ' + (err.message || err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{product ? 'Edit product' : 'New product'}</h3>
          <div className="flex gap-2">
            <button onClick={() => onClose()} className="rounded-md px-3 py-1 text-sm">Close</button>
            <button onClick={saveDraft} disabled={saving} className="rounded-md bg-amber-400 px-3 py-1 text-sm font-semibold">
              {saving ? 'Saving…' : 'Save draft'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="rounded-md border px-3 py-2" placeholder="Title" value={form.title} onChange={(e) => update('title', e.target.value)} />
          <input className="rounded-md border px-3 py-2" placeholder="Category id" value={form.category_id} onChange={(e) => update('category_id', e.target.value)} />
          <textarea className="col-span-2 rounded-md border px-3 py-2" placeholder="Description" value={form.description} onChange={(e) => update('description', e.target.value)} />
          <input className="rounded-md border px-3 py-2" placeholder="Price" value={form.price} onChange={(e) => update('price', e.target.value)} />
          <input className="rounded-md border px-3 py-2" placeholder="MRP" value={form.mrp} onChange={(e) => update('mrp', e.target.value)} />
          <div>
            <label className="text-sm font-medium">Images</label>
            <input type="file" className="mt-2" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImageFile(f); }} />
            <div className="mt-2 flex gap-2 flex-wrap">
              {images.map(img => (
                <div key={img.id} className="h-16 w-16 rounded-md overflow-hidden">
                  <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${img.storage_path}`} className="object-cover h-full w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Variants</div>
            <button onClick={addVariant} className="text-xs text-indigo-600">Add variant</button>
          </div>
          <div className="mt-2 space-y-2">
            {variants.map((v,i) => (
              <div key={i} className="grid grid-cols-4 gap-2">
                <input placeholder="Price" className="rounded-md border px-2" value={v.price} onChange={(e) => updateVariant(i,'price',e.target.value)} />
                <input placeholder="Stock" className="rounded-md border px-2" value={v.stock} onChange={(e) => updateVariant(i,'stock',e.target.value)} />
                <input placeholder="MOQ" className="rounded-md border px-2" value={v.moq} onChange={(e) => updateVariant(i,'moq',e.target.value)} />
                <input placeholder="SKU" className="rounded-md border px-2" value={v.sku} onChange={(e) => updateVariant(i,'sku',e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
