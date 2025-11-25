// netlify/functions/create-order.js
const { createClient } = require('@supabase/supabase-js')

exports.handler = async function(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured' }) }
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const body = JSON.parse(event.body || '{}')
    const items = body.items
    const buyer_id = body.buyer_id || null

    if (!items || !Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No items' }) }
    }

    const variantIds = items.map(i => i.variant_id)
    const { data: variants, error: vErr } = await supabaseAdmin
      .from('product_variants')
      .select('id, price, stock, product_id, sku')
      .in('id', variantIds)

    if (vErr) {
      console.error('variants query err', vErr)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to load variants' }) }
    }

    for (const it of items) {
      const v = variants.find(x => x.id === it.variant_id)
      if (!v) return { statusCode: 400, body: JSON.stringify({ error: `Variant ${it.variant_id} not found` }) }
      if (Number(v.price) !== Number(it.price)) {
        return { statusCode: 400, body: JSON.stringify({ error: `Price mismatch for variant ${it.variant_id}` }) }
      }
      if (Number(v.stock) < Number(it.qty)) {
        return { statusCode: 400, body: JSON.stringify({ error: `Insufficient stock for ${it.variant_id}` }) }
      }
    }

    const total = items.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0)

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({ buyer_id, status: 'pending', total })
      .select()
      .single()

    if (orderErr) {
      console.error('order insert err', orderErr)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create order' }) }
    }

    const orderItemsPayload = items.map(it => ({
      order_id: order.id,
      product_id: it.product_id,
      variant_id: it.variant_id,
      qty: it.qty,
      price: it.price
    }))

    const { error: oiErr } = await supabaseAdmin.from('order_items').insert(orderItemsPayload)
    if (oiErr) {
      console.error('order_items insert err', oiErr)
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create order items' }) }
    }

    for (const it of items) {
      const { error: updErr } = await supabaseAdmin.rpc('decrement_variant_stock', { variant_id_arg: it.variant_id, qty_arg: it.qty })
      if (updErr) {
        console.error('stock update err', updErr)
        await supabaseAdmin.from('order_items').delete().eq('order_id', order.id)
        await supabaseAdmin.from('orders').delete().eq('id', order.id)
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update stock' }) }
      }
    }

    return { statusCode: 200, body: JSON.stringify({ order_id: order.id }) }
  } catch (err) {
    console.error('create-order function error', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) }
  }
}
