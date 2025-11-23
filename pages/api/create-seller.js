// frontend/pages/api/create-seller.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // require service key on server
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_SERVICE_KEY or URL in env')
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    const body = req.body || {}
    // expect user_id (uuid string) and shop_name
    const { user_id, shop_name } = body

    if (!user_id || !shop_name) {
      return res.status(400).json({ error: 'Missing user_id or shop_name' })
    }

    // Confirm there's not already a seller for this user
    const { data: existing, error: e1 } = await supabaseServer
      .from('sellers')
      .select('*')
      .eq('auth_user_id', user_id)
      .limit(1)

    if (e1) throw e1
    if (existing && existing.length > 0) {
      return res.status(200).json({ message: 'Already a seller', seller: existing[0] })
    }

    // Insert seller row
    const { data, error } = await supabaseServer
      .from('sellers')
      .insert([{ auth_user_id: user_id, shop_name }])
      .select()
      .single()

    if (error) throw error
    return res.status(201).json({ message: 'Seller created', seller: data })
  } catch (err) {
    console.error('create-seller error', err)
    return res.status(500).json({ error: err.message || 'Unknown error' })
  }
}
