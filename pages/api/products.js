// pages/api/products.js
import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  const { search, category } = req.query
  
  let q = supabase
    .from('products')
    .select(`
      id,
      title,
      price,
      mrp,
      rating,
      rating_count,
      category_id,
      description,
      product_variants(price, stock),
      product_images(storage_path)
    `)

  if (search) q = q.ilike('title', `%${search}%`)
  if (category) q = q.eq('category_id', category)

  const { data, error } = await q.limit(40)

  if (error) {
    console.error(error)
    return res.status(500).json({ products: [] })
  }

  const products = data.map((p) => ({
    ...p,
    price: p.product_variants?.[0]?.price ?? p.price,
    stock: p.product_variants?.[0]?.stock ?? null,
    imagePath: p.product_images?.[0]?.storage_path ?? null,
  }))

  return res.status(200).json({ products })
}
