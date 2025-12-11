// components/seller/ProductCard.js
import React from "react";
import { makePublicUrl } from "../../lib/supabaseClient"; // create helper to build public storage URL

export default function ProductCard({ product, onEdit, refresh }) {
  const image = product.product_images?.[0]?.storage_path || null;
  const price = product.price ?? (product.product_variants?.[0]?.price ?? 0);
  const stock = product.product_variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? null;
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-md bg-slate-100">
          {image ? <img src={makePublicUrl(image)} alt={product.title} className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">{product.title}</div>
              <div className="text-xs text-slate-400">Category: {product.category_id || "—"}</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">₹{price}</div>
              <div className="text-xs text-slate-400">{stock ? `Stock: ${stock}` : "Stock: —"}</div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className={`rounded-full px-2 py-1 text-xs font-semibold ${product.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {product.approved ? "Active" : "Draft"}
            </div>
            <button onClick={onEdit} className="ml-auto text-xs text-indigo-600">Edit</button>
          </div>
        </div>
      </div>
    </div>
  );
}
