// pages/seller/index.js
import React, { useEffect, useState } from 'react';
import SellerLayout from '../../components/seller/SellerLayout';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function SellerHome() {
  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState({ products: 0, orders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
      if (!data?.user) { setLoading(false); return; }

      try {
        // products count (owner)
        const uid = data.user.id;
        const { count: pc } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', uid);

        // orders count -> we use server API to get accurate count but here quick approach:
        const ordersResp = await fetch('/api/seller/orders/count', {
          headers: { 'Content-Type': 'application/json' },
        });
        const ordersJson = ordersResp.ok ? await ordersResp.json() : { count: 0 };

        setCounts({ products: pc || 0, orders: ordersJson.count || 0 });
      } catch (err) {
        console.error('home init error', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SellerLayout>
      <div className="page-shell">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">Home</h1>
            <p className="text-sm text-slate-500 mt-1">Quick overview of your store activity.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/seller/dashboard"><a className="btn-primary">Manage products</a></Link>
            <Link href="/seller/orders"><a className="btn-secondary">View orders</a></Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-shadow p-4">
            <div className="text-sm text-slate-500">Products</div>
            <div className="mt-3 text-2xl font-semibold">{loading ? '—' : counts.products}</div>
            <div className="text-xs text-slate-400 mt-2">Drafts & published</div>
          </div>

          <div className="card-shadow p-4">
            <div className="text-sm text-slate-500">Orders (affected)</div>
            <div className="mt-3 text-2xl font-semibold">{loading ? '—' : counts.orders}</div>
            <div className="text-xs text-slate-400 mt-2">Orders containing your products</div>
          </div>

          <div className="card-shadow p-4">
            <div className="text-sm text-slate-500">Tips</div>
            <div className="mt-3 text-sm text-slate-700">Complete your store profile and pricing to increase conversions. Use high-quality images (800×800) for better listing appearance.</div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
