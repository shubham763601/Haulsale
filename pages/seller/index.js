// pages/seller/index.js
import React, { useEffect, useState } from 'react';
import SellerLayout from '../../components/seller/SellerLayout';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function SellerHome() {
  const [counts, setCounts] = useState({ products: 0, orders: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) { setLoading(false); return; }

      try {
        const { count: pc } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', uid);

        const { data: pendingRows } = await supabase
          .from('products')
          .select('id')
          .eq('seller_id', uid)
          .eq('approved', false);

        // orders count via server API or via order_items join; quick count via API not included here
        const ordersResp = await fetch('/api/seller/orders/count', { method: 'GET', headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data?.session?.access_token}` } });
        const ordersJson = ordersResp.ok ? await ordersResp.json() : { count: 0 };

        setCounts({ products: pc || 0, orders: ordersJson.count || 0, pending: pendingRows?.length || 0 });
      } catch (err) {
        console.error('seller home error', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-strong p-5">
            <div className="text-xs text-slate-500">Products</div>
            <div className="mt-3 text-2xl font-semibold">{loading ? '—' : counts.products}</div>
            <div className="mt-2 text-xs text-slate-400">Total catalog items (drafts + published)</div>
            <div className="mt-3 flex gap-2">
              <Link href="/seller/dashboard"><a className="btn-seller-primary">Manage products</a></Link>
              <Link href="/seller/dashboard"><a className="px-3 py-2 rounded-lg bg-slate-100 text-sm">Add product</a></Link>
            </div>
          </div>

          <div className="card-strong p-5">
            <div className="text-xs text-slate-500">Orders</div>
            <div className="mt-3 text-2xl font-semibold">{loading ? '—' : counts.orders}</div>
            <div className="mt-2 text-xs text-slate-400">Orders containing your products</div>
            <div className="mt-3">
              <Link href="/seller/orders"><a className="px-3 py-2 rounded-lg bg-slate-100 text-sm">View orders</a></Link>
            </div>
          </div>

          <div className="card-strong p-5">
            <div className="text-xs text-slate-500">Pending approvals</div>
            <div className="mt-3 text-2xl font-semibold">{loading ? '—' : counts.pending}</div>
            <div className="mt-2 text-xs text-slate-400">Products pending admin approval</div>
            <div className="mt-3">
              <Link href="/seller/dashboard"><a className="px-3 py-2 rounded-lg bg-slate-100 text-sm">View drafts</a></Link>
            </div>
          </div>
        </div>

        {/* quick stats / chart placeholder */}
        <div className="mt-6 card-strong p-5">
          <div className="text-sm font-semibold">Store overview</div>
          <div className="mt-2 text-xs text-slate-500">Sales & performance charts will appear here.</div>
        </div>
      </div>
    </SellerLayout>
  );
}
