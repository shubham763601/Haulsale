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
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
      await fetchProducts();
    })();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const userId = (await supabase.auth.getUser()).data?.user?.id;
      if (!userId) { setProducts([]); setLoading(false); return; }

      const { data: rows, error } = await supabase
        .from('products')
        .select(`
          id,title,price,mrp,is_active,approved,created_at,
          product_variants(id,price,stock,moq,sku),
          product_images(id,storage_path,alt_text,position)
        `)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(rows || []);
    } catch (err) {
      console.error('fetchProducts error', err);
    } finally {
      setLoading(false);
    }
  }

  function openNew() { setEditProduct(null); setOpenForm(true); }
  function openEdit(p) { setEditProduct(p); setOpenForm(true); }

  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-sm text-slate-500">Manage products, variants and images. Drafts remain private until approved.</p>
          </div>

          <div className="flex items-center gap-2">
            <input placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
            <button onClick={openNew} className="btn-seller-primary">Add product</button>
          </div>
        </div>

        <div className="mt-6">
          {loading ? <div className="text-sm text-slate-500">Loading…</div> : (
            products.length === 0 ? (
              <div className="rounded-lg border-dashed border p-6 text-center text-slate-500">No products yet — click Add product to create.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.filter(p => (p.title || '').toLowerCase().includes(q.toLowerCase())).map(p => (
                  <ProductCard key={p.id} product={p} onEdit={() => openEdit(p)} refresh={fetchProducts} />
                ))}
              </div>
            )
          )}
        </div>

        {openForm && <ProductForm product={editProduct} onClose={() => { setOpenForm(false); fetchProducts(); }} />}
      </div>
    </SellerLayout>
  );
}
