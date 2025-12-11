// components/seller/ProductCard.js
import React from 'react';
import { makePublicUrl } from '../../lib/supabaseClient';

export default function ProductCard({ product, onEdit }) {
  const image = product.product_images?.[0]?.storage_path || null;
  const price = product.price ?? product.product_variants?.[0]?.price ?? 0;
  const stock = (product.product_variants || []).reduce((s, v) => s + (v.stock || 0), 0);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border">
      <div className="flex gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-md bg-slate-100 flex items-center justify-center">
          {image ? <img src={makePublicUrl(image)} alt={product.title} className="h-full w-full object-cover" /> : <div className="text-xs text-slate-400">No image</div>}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">{product.title}</div>
              <div className="text-xs text-slate-500 mt-1">Category: {product.category_id || '—'}</div>
            </div>

            <div className="text-right">
              <div className="text-sm font-semibold text-slate-900">₹{Number(price).toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">{stock ? `Stock: ${stock}` : 'Stock: —'}</div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {product.approved ? 'Active' : 'Draft'}
            </span>

            <button onClick={onEdit} className="ml-auto text-xs text-indigo-600">Edit</button>
          </div>
        </div>
      </div>
    </div>
  );
}
