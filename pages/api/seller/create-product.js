// pages/api/seller/create-product.js
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { supabase } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    // simple CORS preflight (in case you ever need it)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // ----- 1) Auth: get token from Authorization header -----
    const authHeader = req.headers.authorization || ''
    const token = authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'Missing Bearer token' })
    }

    // Use normal supabase client to validate token (anon key on server is okay)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('getUser error:', userError)
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const sellerUuid = user.id

    // ----- 2) Parse body -----
    const { title, description = '', category_id, variants, images } = req.body || {}

    if (!title || !category_id || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        error: 'title, category_id and at least one variant are required',
      })
    }

    // Basic shape check for variants
    for (const v of variants) {
      if (!v || typeof v.sku !== 'string' || v.price == null || v.stock == null) {
        return res.status(400).json({
          error: 'Each variant must have sku, price and stock',
        })
      }
    }

    // images can be optional array
    const safeImages = Array.isArray(images) ? images : []

    // ----- 3) Confirm seller row exists -----
    const { data: sellerRow, error: sellerErr } = await supabaseAdmin
      .from('sellers')
      .select('auth_user_id')
      .eq('auth_user_id', sellerUuid)
      .maybeSingle()

    if (sellerErr) {
      console.error('seller lookup error:', sellerErr)
      return res.status(500).json({ error: 'Failed to verify seller' })
    }

    if (!sellerRow) {
      return res.status(400).json({ error: 'Seller profile not found. Please complete store profile first.' })
    }

    // ----- 4) Call RPC function create_product_full -----
    // SQL signature:
    // create_product_full(p_seller_uuid uuid,
    //                     p_category_id int4,
    //                     p_title text,
    //                     p_description text,
    //                     p_variants jsonb,
    //                     p_images jsonb)
    const { data, error } = await supabaseAdmin.rpc('create_product_full', {
      p_seller_uuid: sellerUuid,
      p_category_id: category_id,
      p_title: title,
      p_description: description || '',
      p_variants: variants,   // supabase-js sends JS array as jsonb
      p_images: safeImages,   // same for images
    })

    if (error) {
      console.error('create_product_full error:', error)
      return res.status(400).json({ error: error.message || 'RPC failed' })
    }

    const productId = data

    return res.status(200).json({
      success: true,
      product_id: productId,
    })
  } catch (err) {
    console.error('create-product API error:', err)
    return res.status(500).json({
      error: 'Server error',
      detail: err.message || String(err),
    })
  }
}
