// pages/api/admin/toggle-seller-approval.js
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

  const { data: adminProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .maybeSingle()

  if (!adminProfile || adminProfile.role !== 'admin') {
    return res.status(403).json({ code: 403, message: 'Forbidden' })
  }

  const { user_id, approve, note } = req.body
  if (!user_id || typeof approve === 'undefined') return res.status(400).json({ error: 'user_id and approve required' })

  const newStatus = approve ? 'approved' : 'rejected'

  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ seller_status: newStatus })
      .eq('id', user_id)

    if (error) throw error

    await supabaseAdmin.from('admin_audit').insert({
      admin_id: adminUser.id,
      target_user_id: user_id,
      action: 'seller_approval',
      note: note || newStatus,
    })

    return res.status(200).json({ success: true, status: newStatus })
  } catch (err) {
    console.error('toggle-seller-approval error', err)
    return res.status(500).json({ error: 'server error', detail: err.message || err })
  }
}
