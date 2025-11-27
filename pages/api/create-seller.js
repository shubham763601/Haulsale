// frontend/pages/api/create-seller.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

// admin client (service role) - used only server-side (never in browser)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Get bearer token from client (client should pass the user's access token)
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) return res.status(401).json({ error: 'Missing access token' })

    // verify the token & get user
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.getUser(token)
    if (getUserError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    const user = userData.user

    // body expected: { shop_name: 'My Shop' }
    const { shop_name } = req.body
    if (!shop_name) return res.status(400).json({ error: 'Missing shop_name' })

    // Insert into sellers table using the admin client (service role bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('sellers')
      .insert({ auth_user_id: user.id, shop_name })
      .select()
      .single()

    if (error) {
      console.error('Insert seller error:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Seller created', seller: data })
  } catch (err) {
    console.error('create-seller exception', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
