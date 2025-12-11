// components/seller/OrdersList.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const res = await fetch('/api/seller/orders', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setOrders(json.orders || []);
    } catch (err) {
      console.error('fetchOrders error', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function markShipped(orderId) {
    // Example: you may update order fulfillment status via admin or server endpoint
    alert('Mark shipped - implement server endpoint to change fulfillment_status');
  }

  if (loading) return <div className="text-sm text-slate-500">Loading orders…</div>;
  if (!orders.length) return <div className="text-sm text-slate-500">No orders containing your products yet.</div>;

  return (
    <div className="space-y-4">
      {orders.map(o => (
        <div key={o.id} className="card-shadow p-4 flex justify-between items-start">
          <div>
            <div className="text-sm text-slate-500">Order #{o.order_number} — {new Date(o.created_at).toLocaleString()}</div>
            <div className="mt-2 font-semibold">Buyer: {o.buyer_id}</div>
            <div className="mt-2 text-sm text-slate-600">Items (your products in this order):</div>
            <ul className="mt-2 space-y-1">
              {(o.items || []).map(it => (
                <li key={it.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{it.product_title}</div>
                    <div className="text-xs text-slate-500">{it.qty} × ₹{it.unit_price}</div>
                  </div>
                  <div className="text-sm font-semibold">₹{it.total_price}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500 mb-3">Status: {o.fulfillment_status}</div>
            <button className="btn-secondary" onClick={() => markShipped(o.id)}>Mark shipped</button>
          </div>
        </div>
      ))}
    </div>
  );
}
