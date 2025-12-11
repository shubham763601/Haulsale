// components/seller/ProductForm.js
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const BUCKET = process.env.NEXT_PUBLIC_PRODUCT_IMAGES_BUCKET || "product-images";

export default function ProductForm({ product = null, onClose }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    mrp: "",
    category_id: null,
    is_active: false
  });
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    })();
    if (product) {
      setForm({
        title: product.title || "",
        description: product.description || "",
        price: product.price || "",
        mrp: product.mrp || "",
        category_id: product.category_id || null,
        is_active: product.is_active || false
      });
      setVariants(product.product_variants || []);
      setImages(product.product_images || []);
    }
  }, [product]);

  function update(k, v) { setForm(f => ({...f, [k]: v})); }

  function addVariant() {
    setVariants(v => [...v, { price: "", stock: "", moq: "", sku: "" }]);
  }
  function updateVariant(i, k, v) {
    const copy = [...variants]; copy[i][k] = v; setVariants(copy);
  }
  function removeVariant(i) { setVariants(v => v.filter((_, idx) => idx !== i)); }

  async function handleImageFile(file) {
    if (!user) { alert("Please login"); return; }
    // ensure product exists (create draft if necessary)
    let productId = product?.id;
    if (!productId) {
      const created = await saveDraft();
      productId = created?.id;
      if (!productId) return;
    }

    // upload to storage
    const filename = `${productId}/${Date.now()}_${file.name.replace(/\s/g,"_")}`;
    const { data: upData, error: upErr } = await supabase.storage.from(BUCKET).upload(filename, file, { upsert: false });
    if (upErr || !upData) {
      console.error("upload error", upErr); alert("Upload failed: "+ (upErr?.message||"")); return;
    }
    // call server route to insert metadata
    const session = await supabase.auth.getSession();
    const token = session.data?.session?.access_token;
    const resp = await fetch("/api/seller/product_images", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ product_id: productId, storage_path: upData.path, alt_text: file.name, position: 0 })
    });
    if (!resp.ok) {
      const t = await resp.text();
      alert("Server image insert failed: " + t);
      return;
    }
    const json = await resp.json();
    setImages(prev => [...prev, json.image]);
  }

  async function saveDraft() {
    setSaving(true);
    setTimeout(()=>{},0);
    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const method = product?.id ? "PUT" : "POST";
      const url = product?.id ? `/api/seller/products/${product.id}` : `/api/seller/products`;
      const payload = { ...form, product_variants: variants };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      alert("Saved");
      if (onClose) onClose();
      return json.product;
    } catch (err) {
      console.error("saveDraft error", err);
      alert("Save failed: " + (err.message||err));
      return null;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">{product ? "Edit product" : "New product"}</h3>
          <div className="flex gap-2">
            <button className="rounded-md px-3 py-1 text-sm" onClick={onClose}>Close</button>
            <button className="rounded-md bg-amber-500 px-3 py-1 text-sm text-slate-900" onClick={saveDraft} disabled={saving}>{saving ? "Saving…" : "Save draft"}</button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="rounded-md border px-3 py-2" placeholder="Title" value={form.title} onChange={e=>update("title", e.target.value)} />
          <input className="rounded-md border px-3 py-2" placeholder="Category id" value={form.category_id||""} onChange={e=>update("category_id", e.target.value)} />
          <textarea className="col-span-2 rounded-md border px-3 py-2" placeholder="Description" value={form.description} onChange={e=>update("description", e.target.value)} />
          <input className="rounded-md border px-3 py-2" placeholder="Price" value={form.price} onChange={e=>update("price", e.target.value)} />
          <input className="rounded-md border px-3 py-2" placeholder="MRP" value={form.mrp} onChange={e=>update("mrp", e.target.value)} />
          <div>
            <label className="text-sm font-medium">Images</label>
            <input type="file" className="mt-2" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) handleImageFile(f); }} />
            <div className="mt-2 flex gap-2">
              {images.map((img,i)=> <div key={i} className="h-16 w-16 overflow-hidden rounded-md bg-slate-100"><img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${img.storage_path}`} className="h-full w-full object-cover"/></div>)}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Variants</div>
            <button className="text-xs text-indigo-600" onClick={()=>addVariant()}>Add variant</button>
          </div>
          <div className="mt-2 space-y-2">
            {variants.map((v,i)=>(
              <div key={i} className="grid grid-cols-4 gap-2">
                <input placeholder="Price" className="rounded-md border px-2" value={v.price} onChange={(e)=>updateVariant(i,"price",e.target.value)} />
                <input placeholder="Stock" className="rounded-md border px-2" value={v.stock} onChange={(e)=>updateVariant(i,"stock",e.target.value)} />
                <input placeholder="MOQ" className="rounded-md border px-2" value={v.moq} onChange={(e)=>updateVariant(i,"moq",e.target.value)} />
                <input placeholder="SKU" className="rounded-md border px-2" value={v.sku} onChange={(e)=>updateVariant(i,"sku",e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
