import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // <-- safe (runs only on server)
)

export default async function handler(req, res) {

  const { user_id, shop_name } = req.body;

  const { data, error } = await supabase
    .from('sellers')
    .insert({ user_id, shop_name })
    .select('*')
    .single()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.status(200).json({ message: 'Seller created', seller: data })
}
