// frontend/pages/api/create-seller.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Service role key missing on server')
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user_id, shop_name } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    // Insert seller row using server role key (bypass RLS)
    const { data, error } = await supabaseAdmin
      .from('sellers')
      .insert([{ auth_user_id: user_id, shop_name }])
      .select()
      .single();

    if (error) {
      console.error('create-seller error:', error);
      return res.status(500).json({ error: 'DB insert failed', details: error.message });
    }

    return res.status(200).json({ message: 'Seller created', seller: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
