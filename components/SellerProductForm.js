// components/SellerProductForm.js
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function SellerProductForm({ productId }) {
  // productId: optional — when present, form edits an existing product
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState({
    title: "",
    description: "",
    price: "",
    mrp: "",
    category_id: null,
    is_active: false
  });
  const [variants, setVariants] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);

      if (productId) {
        // fetch product drafts or your own product for edit
        const { data: p } = await supabase
          .from("products")
          .select(`
            *,
            product_variants ( id, price, stock, moq, sku )
          `)
          .eq("id", productId)
          .maybeSingle();
        if (p) {
          setProduct(p);
          setVariants(p.product_variants || []);
        }
      }
      setLoading(false);
    })();
  }, [productId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const url = productId ? `/api/seller/products/${productId}` : `/api/seller/products`;
      const method = productId ? "PUT" : "POST";
      const payload = {
        ...product,
        product_variants: variants.map(v => ({ price: v.price, stock: v.stock, moq: v.moq, sku: v.sku }))
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Save failed");
      }
      const json = await res.json();
      setSuccess(productId ? "Product updated" : "Product draft saved");
      if (!productId && json.product) {
        // redirect to edit page or show link
        window.location.href = `/seller/products/${json.product.id}/edit`;
      }
    } catch (err) {
      setError(err.message || "Save error");
    } finally {
      setSaving(false);
    }
  }

  function addVariant() {
    setVariants(v => [...v, { price: "", stock: "", moq: "", sku: "" }]);
  }
  function updateVariant(i, field, val) {
    const copy = [...variants];
    copy[i] = { ...copy[i], [field]: val };
    setVariants(copy);
  }
  function removeVariant(i) {
    setVariants(v => v.filter((_, idx) => idx !== i));
  }

  if (loading) return <div>Loading…</div>;
  if (!user) return <div>Please login to create products.</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input className="mt-1 w-full rounded-md border" value={product.title} onChange={e => setProduct(p => ({...p, title: e.target.value}))}/>
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea value={product.description} onChange={e => setProduct(p => ({...p, description: e.target.value}))} className="mt-1 w-full rounded-md border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Price</label>
          <input value={product.price} onChange={e => setProduct(p => ({...p, price: e.target.value}))} className="mt-1 rounded-md border w-full" />
        </div>
        <div>
          <label className="text-sm">MRP</label>
          <input value={product.mrp} onChange={e => setProduct(p => ({...p, mrp: e.target.value}))} className="mt-1 rounded-md border w-full" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Variants</label>
          <button type="button" onClick={addVariant} className="text-xs text-indigo-700">Add variant</button>
        </div>
        <div className="space-y-2 mt-2">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 items-end">
              <input placeholder="Price" value={v.price} onChange={e => updateVariant(i, "price", e.target.value)} className="rounded-md border" />
              <input placeholder="Stock" value={v.stock} onChange={e => updateVariant(i, "stock", e.target.value)} className="rounded-md border" />
              <input placeholder="MOQ" value={v.moq} onChange={e => updateVariant(i, "moq", e.target.value)} className="rounded-md border" />
              <div className="flex gap-2">
                <input placeholder="SKU" value={v.sku} onChange={e => updateVariant(i, "sku", e.target.value)} className="rounded-md border" />
                <button type="button" onClick={() => removeVariant(i)} className="text-sm text-red-600">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold">
          {saving ? "Saving…" : (productId ? "Update product" : "Save draft")}
        </button>
        <button type="button" onClick={() => { /* optional: preview or navigate */ }} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-emerald-700">{success}</div>}
    </form>
  );
}
