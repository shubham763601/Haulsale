// pages/api/seller/orders.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// helper: returns orders with only the items belonging to this seller
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '') || req.cookies['sb:token'] || null;
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const { data: uData, error: uErr } = await supabaseAdmin.auth.getUser(token);
    if (uErr || !uData?.user) return res.status(401).json({ error: 'Invalid token' });
    const sellerId = uData.user.id;

    // pagination
    const page = parseInt(req.query.page || '1', 10);
    const per = parseInt(req.query.per || '12', 10);
    const offset = (page - 1) * per;

    // Get order ids containing seller products
    const { data: orderIds, error: idErr } = await supabaseAdmin
      .from('order_items')
      .select('order_id', { count: 'exact' })
      .eq('product ->> \'seller_id\'', sellerId) // NOT valid: product is FK; we must join via products
      .limit(per)
      .offset(offset);

    // We cannot filter on relational FK using arrow; instead use SQL via from('order_items').select('order_id, product_id') then filter by product join
    // Use raw SQL for reliable join:
    const sql = `
      SELECT o.id AS order_id,
             o.buyer_id,
             o.order_number,
             o.items_total,
             o.grand_total,
             o.currency,
             o.payment_status,
             o.fulfillment_status,
             o.created_at
      FROM public.orders o
      WHERE o.id IN (
        SELECT DISTINCT oi.order_id
        FROM public.order_items oi
        JOIN public.products p ON p.id = oi.product_id
        WHERE p.seller_id = $1
      )
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    // supabaseAdmin does not provide raw SQL exec directly; use RPC pattern -> create a simple helper RPC in your DB named "exec_sql(q json)" OR fallback to the following approach:
    // We'll fetch relevant order ids first then fetch the orders.
    const { data: orderIdRows } = await supabaseAdmin
      .from('order_items')
      .select('order_id, product_id')
      .limit(10000); // caution: if very large, change to server-side SQL migration

    // filter in JS: find order ids whose product belongs to seller
    const productIds = (await supabaseAdmin.from('products').select('id').eq('seller_id', sellerId)).data.map(r => r.id);
    const orderIdsSet = new Set(orderIdRows.filter(oi => productIds.includes(oi.product_id)).map(oi => oi.order_id));
    const orderIdsArray = Array.from(orderIdsSet);

    // now grab orders for these IDs (paginated slice)
    const slice = orderIdsArray.slice(offset, offset + per);
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, buyer_id, items_total, grand_total, currency, payment_status, fulfillment_status, created_at')
      .in('id', slice)
      .order('created_at', { ascending: false });

    // For each order, fetch only items that belong to this seller
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('id, order_id, product_id, product_title, qty, unit_price, total_price, variant_id')
      .in('order_id', slice);

    // filter items by products that belong to seller
    const itemsByOrder = {};
    for (const it of items || []) {
      // check if product belongs to seller
      if (!productIds.includes(it.product_id)) continue;
      itemsByOrder[it.order_id] = itemsByOrder[it.order_id] || [];
      itemsByOrder[it.order_id].push(it);
    }

    const resp = (orders || []).map(o => ({
      ...o,
      items: itemsByOrder[o.id] || []
    }));

    return res.json({ orders: resp, page, per });
  } catch (err) {
    console.error('seller/orders API error', err);
    return res.status(500).json({ error: 'internal' });
  }
}
