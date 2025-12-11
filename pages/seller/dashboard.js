// pages/seller/dashboard.js
import React, { useEffect, useState } from 'react';
import SellerLayout from '../../components/seller/SellerLayout';
import ProductCard from '../../components/seller/ProductCard';
import ProductForm from '../../components/seller/ProductForm';
import { supabase } from '../../lib/supabaseClient';

export default function SellerDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data?.user ?? null);
        await fetchProducts();
      } catch (e) {
        console.error('dashboard init error', e);
      }
    })();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const userId = (await supabase.auth.getUser()).data?.user?.id;
      if (!userId) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Seller sees OWN products (drafts + pending + approved)
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, title, price, mrp, is_active, approved, created_at,
          product_variants ( id, price, stock, moq, sku ),
          product_images ( id, storage_path, alt_text, position )
        `)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('fetchProducts error', err);
    } finally {
      setLoading(false);
    }
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
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Products</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your catalog — drafts stay private until approved.</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              className="rounded-md border border-slate-200 px-3 py-2 text-sm w-60"
              placeholder="Search products"
              value={q}
              onChange={(e) => setQ(e.target.value)}
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
            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-slate-500">
              You don't have any products yet. Click <strong>Add product</strong> to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
              {products
                .filter((p) => (p.title || '').toLowerCase().includes(q.toLowerCase()))
                .map((p) => (
                  <ProductCard key={p.id} product={p} onEdit={() => openEdit(p)} refresh={fetchProducts} />
                ))}
            </div>
          )}
        </div>
      </div>

      {openForm && <ProductForm product={editProduct} onClose={() => { setOpenForm(false); fetchProducts(); }} />}
    </SellerLayout>
  );
}
