// pages/api/create-order.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY // must be set in Netlify/Vercel envs

const server = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { items } = req.body
  if (!items || !items.length) return res.status(400).json({ error: 'No items' })

  try {
    // Validate each item's price and stock from DB
    const variantIds = items.map(i => i.variant_id)
    const { data: variants } = await server
      .from('product_variants')
      .select('id, price, stock, product_id, sku')
      .in('id', variantIds)

    // price check
    for (const it of items) {
      const v = variants.find(x => x.id === it.variant_id)
      if (!v) return res.status(400).json({ error: `Variant ${it.variant_id} not found` })
      if (Number(v.price) !== Number(it.price)) {
        return res.status(400).json({ error: 'Price mismatch for variant ' + it.variant_id })
      }
      if (v.stock < it.qty) return res.status(400).json({ error: 'Insufficient stock for ' + it.variant_id })
    }

    // Create order rows (orders + order_items)
    const orderPayload = {
      buyer_id: req.headers['x-user-id'] || null, // better: require auth, or pass user id from server auth
      status: 'pending',
      total: items.reduce((s, it) => s + (it.price * it.qty), 0),
      created_at: new Date().toISOString()
    }

    const { data: order } = await server.from('orders').insert(orderPayload).select().single()

    const orderItems = items.map(it => ({
      order_id: order.id,
      variant_id: it.variant_id,
      product_id: it.product_id,
      qty: it.qty,
      price: it.price
    }))

    await server.from('order_items').insert(orderItems)

    // Optionally decrement stock
    for (const it of items) {
      await server.from('product_variants').update({ stock: (variants.find(v => v.id === it.variant_id).stock - it.qty) }).eq('id', it.variant_id)
    }

    return res.status(200).json({ order_id: order.id })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
