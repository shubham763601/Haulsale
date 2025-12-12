// components/seller/ProductCard.js
import React from 'react';
import { makePublicUrl } from '../../lib/supabaseClient';

export default function ProductCard({ product, onEdit = () => {}, refresh = () => {} }) {
  const img = product.product_images?.[0]?.storage_path ?? null;
  const price = product.product_variants?.[0]?.price ?? product.price ?? 0;
  const stock = (product.product_variants || []).reduce((s, v) => s + (v.stock || 0), 0);

  async function toggleActive() {
    try {
      const token = (await fetch('/api/auth/token').then(r => r.text())).trim(); // optional: if you have token endpoint
      const resp = await fetch(`/api/seller/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await (await import('../../lib/supabaseClient')).supabase.auth.getSession()).data?.session?.access_token}` },
        body: JSON.stringify({ is_active: !product.is_active })
      });
      if (!resp.ok) throw new Error('update failed');
      refresh();
    } catch (err) {
      console.error('toggleActive', err);
      alert('Failed to update');
    }
  }

  return (
    <div className="card-strong p-4 flex flex-col">
      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center">
          {img ? <img src={makePublicUrl(img)} className="object-cover w-full h-full" /> : <div className="text-xs text-slate-400">No image</div>}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900">{product.title}</div>
              <div className="text-xs text-slate-500 mt-1">₹{Number(price).toFixed(2)}</div>
            </div>

            <div className="text-right text-xs">
              <div className={`px-2 py-1 rounded-full text-[11px] ${product.approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {product.approved ? 'Published' : 'Draft'}
              </div>
              <div className="mt-2 text-slate-500">Stock: {stock || '—'}</div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button onClick={onEdit} className="px-3 py-1 rounded-md border text-sm">Edit</button>
            <button onClick={toggleActive} className="px-3 py-1 rounded-md bg-slate-100 text-sm">Toggle active</button>
          </div>
        </div>
      </div>
    </div>
  );
}
