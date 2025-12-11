// pages/seller/dashboard.js
import React, { useEffect, useState } from "react";
import SellerLayout from "../../components/seller/SellerLayout";
import ProductCard from "../../components/seller/ProductCard";
import ProductForm from "../../components/seller/ProductForm";
import { supabase } from "../../lib/supabaseClient";

export default function SellerDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      await fetchProducts();
    })();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    // seller should see their own products (drafts + pending + approved)
    const { data, error } = await supabase
      .from("products")
      .select(`
        id, title, price, mrp, rating, rating_count, is_active, approved, created_at,
        product_variants ( id, price, stock, moq, sku ),
        product_images ( storage_path )
      `)
      .eq("seller_id", (await supabase.auth.getUser()).data?.user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchProducts error", error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  function openNew() {
    setEditProduct(null);
    setOpenForm(true);
  }

  function openEdit(p) {
    setEditProduct(p);
    setOpenForm(true);
  }

  return (
    <SellerLayout>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900">Products</h2>
          <div className="flex items-center gap-3">
            <input
              placeholder="Search products"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
            <button onClick={openNew} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm">
              Add product
            </button>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="text-sm text-slate-500">Loading products…</div>
          ) : products.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-slate-500">No products yet. Click “Add product” to create a draft.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products
                .filter((p) => p.title?.toLowerCase().includes(q.toLowerCase()))
                .map((p) => (
                  <ProductCard key={p.id} product={p} onEdit={() => openEdit(p)} refresh={fetchProducts} />
                ))}
            </div>
          )}
        </div>
      </div>

      {openForm && (
        <ProductForm
          onClose={() => { setOpenForm(false); fetchProducts(); }}
          product={editProduct}
        />
      )}
    </SellerLayout>
  );
}
