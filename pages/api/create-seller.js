/*
 server-side API route to create a seller record using service role key
 Requires SUPABASE_SERVICE_KEY in env (server-only)
*/
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  if(!SERVICE_KEY || !URL) return res.status(500).json({ error: 'Supabase service key not configured' })

  const supabaseAdmin = createClient(URL, SERVICE_KEY)

  try {
    const body = req.body
    const auth_user_id = body?.auth_user_id
    const shop_name = body?.shop_name || 'My Shop'

    if(!auth_user_id) return res.status(400).json({ error: 'auth_user_id required' })

    // Insert into sellers table
    const { data, error } = await supabaseAdmin
      .from('sellers')
      .insert([{ auth_user_id, shop_name }])
      .select()
      .single()

    if(error) throw error

    return res.status(200).json({ message: 'Seller created', seller: data })
  } catch (err) {
    console.error('create-seller error', err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
