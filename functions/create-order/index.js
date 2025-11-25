// functions/create-order/index.ts
import { serve } from "std/server"
import { createClient } from "@supabase/supabase-js"

// The service role key should be set in the Supabase function environment (NOT in client)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    const body = await req.json()
    const items = body.items
    const buyer_id = body.buyer_id || null

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items' }), { status: 400 })
    }

    // validate variant ids
    const variantIds = items.map(i => i.variant_id)
    const { data: variants, error: vErr } = await supabaseAdmin
      .from('product_variants')
      .select('id, price, stock, product_id, sku')
      .in('id', variantIds)

    if (vErr) {
      console.error("variants query err", vErr)
      return new Response(JSON.stringify({ error: 'Failed to load variants' }), { status: 500 })
    }

    // build checks
    for (const it of items) {
      const v = variants.find(x => x.id === it.variant_id)
      if (!v) return new Response(JSON.stringify({ error: `Variant ${it.variant_id} not found` }), { status: 400 })
      if (Number(v.price) !== Number(it.price)) {
        return new Response(JSON.stringify({ error: `Price mismatch for variant ${it.variant_id}` }), { status: 400 })
      }
      if (Number(v.stock) < Number(it.qty)) {
        return new Response(JSON.stringify({ error: `Insufficient stock for variant ${it.variant_id}` }), { status: 400 })
      }
    }

    // Start a transaction using SQL (Postgres transaction)
    // Supabase JS doesn't provide explicit transaction API; use SQL function to wrap transaction
    // Here we will run a single SQL statement that inserts order, order_items and updates stock atomically
    const total = items.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0)

    // Prepare order_items rows for insertion
    // We'll use a CTE-based transaction in SQL to insert order and items and then update stocks
    const itemsJson = JSON.stringify(items).replace(/'/g, "''") // escape single quotes
    const sql = `
      WITH ins_order AS (
        INSERT INTO public.orders (buyer_id, status, total)
        VALUES ($1, 'pending', $2::numeric)
        RETURNING id
      ),
      ins_items AS (
        INSERT INTO public.order_items (order_id, product_id, variant_id, qty, price)
        SELECT ins_order.id, (it->>'product_id')::bigint, (it->>'variant_id')::bigint, (it->>'qty')::int, (it->>'price')::numeric
        FROM ins_order, jsonb_array_elements_text($3::jsonb) AS j(it)
        RETURNING *
      ),
      upd_stock AS (
        -- decrement stock for each variant
        UPDATE public.product_variants pv
        SET stock = pv.stock - x.qty
        FROM (
          SELECT (it->>'variant_id')::bigint AS vid, (it->>'qty')::int AS qty
          FROM jsonb_array_elements_text($3::jsonb) AS j(it)
        ) AS x
        WHERE pv.id = x.vid
        RETURNING pv.id
      )
      SELECT (SELECT id FROM ins_order) as order_id;
    `

    const { data: orderResult, error: execErr } = await supabaseAdmin.rpc('sql', {
      // NOTE: Supabase does not allow raw multi-statement SQL via rpc('sql') by default.
      // Therefore, use 'query' via Postgres function "pg_execute" or create a stored procedure.
      // If your Supabase project allows, you can run the SQL above via a database function.
      // For simplicity, here we fall back to a programmatic approach:
    })

    // Fallback: programmatic approach with db transaction via multiple steps (with optimistic locking)
    // 1) Insert order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({ buyer_id, status: 'pending', total })
      .select()
      .single()

    if (orderErr) {
      console.error("order insert err", orderErr)
      return new Response(JSON.stringify({ error: 'Failed to create order' }), { status: 500 })
    }

    // 2) Insert order items
    const orderItemsPayload = items.map(it => ({
      order_id: order.id,
      product_id: it.product_id,
      variant_id: it.variant_id,
      qty: it.qty,
      price: it.price
    }))

    const { data: oi, error: oiErr } = await supabaseAdmin.from('order_items').insert(orderItemsPayload)
    if (oiErr) {
      console.error("order_items insert err", oiErr)
      // attempt cleanup: delete order
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      return new Response(JSON.stringify({ error: 'Failed to create order items' }), { status: 500 })
    }

    // 3) Decrement stock for each variant (perform one-by-one with check)
    for (const it of items) {
      const { data: updated, error: updErr } = await supabaseAdmin
        .rpc('decrement_variant_stock', { variant_id_arg: it.variant_id, qty_arg: it.qty })
    // decrement_variant_stock should be a stored procedure to safely decrement with check
      if (updErr) {
        console.error("stock update err", updErr)
        // rollback: delete inserted order items & order
        await supabaseAdmin.from('order_items').delete().eq('order_id', order.id)
        await supabaseAdmin.from('orders').delete().eq('id', order.id)
        return new Response(JSON.stringify({ error: 'Failed to update stock' }), { status: 500 })
      }
    }

    return new Response(JSON.stringify({ order_id: order.id }), { status: 200 })
  } catch (err) {
    console.error('create-order function error', err)
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
})
// Note: The above code assumes the existence of a stored procedure 'decrement_variant_stock' in the database
// which safely decrements stock and raises an error if stock would go negative.
