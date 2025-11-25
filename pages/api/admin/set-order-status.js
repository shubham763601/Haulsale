// pages/api/admin/set-order-status.js
import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function getCallingUser(token) {
  if (!token) return null
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error) return null
  return data?.user ?? null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]
  const adminUser = await getCallingUser(token)
  if (!adminUser) return res.status(401).json({ code: 401, message: 'Invalid auth token' })
  const { data: adminProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', adminUser.id).maybeSingle()
  if (!adminProfile || adminProfile.role !== 'admin') return res.status(403).json({ code: 403, message: 'Forbidden' })

  const { order_id, status } = req.body
  if (!order_id || !status) return res.status(400).json({ error: 'order_id and status required' })

  try {
    const { error } = await supabaseAdmin.from('orders').update({ status }).eq('id', order_id)
    if (error) throw error
    await supabaseAdmin.from('admin_audit').insert({ admin_id: adminUser.id, target_user_id: null, action: 'order_status_change', note: `order ${order_id} => ${status}` })
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('set-order-status error', err)
    return res.status(500).json({ error: 'server error', detail: err.message || err })
  }
}
