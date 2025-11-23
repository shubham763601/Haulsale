// pages/api/create-seller.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!SERVICE_KEY || !URL) {
    return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL on server' })
  }

  const supabase = createClient(URL, SERVICE_KEY)

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')
    // prefer user_id from body; fallback to token-based
    const user_id = body.user_id

    if (!user_id) {
      return res.status(400).json({ error: 'user_id required' })
    }

    const shop_name = body.shop_name || 'Demo Wholesale'

    const { data, error } = await supabase
      .from('sellers')
      .insert([{ auth_user_id: user_id, shop_name }])
      .select()
      .single()

    if (error) {
      console.error('create-seller supabase error', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Seller created', seller: data })
  } catch (err) {
    console.error('create-seller exception', err)
    return res.status(500).json({ error: err.message || 'server error' })
  }
}
