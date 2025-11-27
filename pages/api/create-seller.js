// pages/api/seller/create-product.js
import { supabase } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })

  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No auth token' })

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Invalid user' })

  const { title, description, category_id, variants, images } = req.body

  // Validate inputs
  if (!title || !category_id || !variants?.length) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Call RPC
  const { data, error } = await supabase.rpc('create_product_full', {
    p_seller_id: user.id,
    p_category_id: category_id,
    p_title: title,
    p_description: description,
    p_variants: variants,
    p_images: images
  })

  if (error) {
    console.error(error)
    return res.status(400).json({ error: error.message })
  }

  return res.status(200).json({ success: true, product_id: data })
}