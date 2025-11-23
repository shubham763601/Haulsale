// pages/api/create-seller.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!SERVICE_ROLE_KEY) {
    console.error('Service role key missing')
    return res.status(500).json({ error: 'Service role key missing' })
  }

  // Create admin Supabase client using service role key (server-only)
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  try {
    const body = req.body || {}
    const { user_id: authUserId, shop_name } = body

    if (!authUserId) {
      return res.status(400).json({ error: 'user_id required' })
    }

    // Ensure profile exists (optional): try upsert profile from auth (fetch auth user)
    // We trust authUserId is the uuid from client (obtained from supabase.auth.getUser())

    // Create seller row referencing profiles.id (authUserId)
    const { data, error } = await supabaseAdmin
      .from('sellers')
      .insert([{ auth_user_id: authUserId, shop_name }])
      .select()
      .single()

    if (error) {
      console.error('create-seller error', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Seller created', seller: data })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Unexpected server error' })
  }
}
