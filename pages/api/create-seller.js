// pages/api/create-seller.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SERVICE_ROLE || !SUPA_URL) return res.status(500).json({ error: 'Server misconfigured' });

  // server client with service role key
  const supabaseAdmin = createClient(SUPA_URL, SERVICE_ROLE);

  // Optional: validate incoming bearer token (Authorization) to get user id
  // If you prefer, client sends user_id in body instead
  let userId = null;
  try {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // validate token using supabaseAdmin.auth.getUser
      const { data: sessionData, error } = await supabaseAdmin.auth.getUser(token);
      if (error) {
        // token invalid -> try fallback to body user_id
        userId = req.body?.user_id ?? null;
      } else {
        userId = sessionData?.user?.id;
      }
    } else {
      userId = req.body?.user_id ?? null;
    }
  } catch (e) {
    userId = req.body?.user_id ?? null;
  }

  if (!userId) return res.status(401).json({ error: 'Not authorized' });

  const shop_name = (req.body?.shop_name || 'My Shop').slice(0, 200);

  // Create seller record and return new seller
  const { data, error } = await supabaseAdmin
    .from('sellers')
    .insert({ user_id: userId, shop_name })
    .select()
    .single();

  if (error) {
    console.error('create-seller error', error);
    return res.status(500).json({ error: 'DB insert failed', detail: error.message });
  }

  return res.status(200).json({ message: 'Seller created', seller: data });
}
