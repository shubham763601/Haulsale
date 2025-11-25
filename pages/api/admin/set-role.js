// pages/api/admin/set-role.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE URL or SERVICE_ROLE_KEY in environment')
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function getCallingUser(token) {
  if (!token) return null
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error) return null
  return data?.user ?? null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Expect Authorization: Bearer <access_token>
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]

  const adminUser = await getCallingUser(token)
  if (!adminUser) return res.status(401).json({ code: 401, message: 'Invalid auth token' })

  // Confirm admin role
  const { data: adminProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .maybeSingle()
  if (!adminProfile || adminProfile.role !== 'admin') {
    return res.status(403).json({ code: 403, message: 'Forbidden: admin only' })
  }

  const { user_id, role, note } = req.body
  if (!user_id || !role) return res.status(400).json({ error: 'user_id and role required' })

  try {
    const { error: upsertError } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', user_id)

    if (upsertError) throw upsertError

    // Insert audit log
    await supabaseAdmin.from('admin_audit').insert({
      admin_id: adminUser.id,
      target_user_id: user_id,
      action: 'set_role',
      note: note || `role => ${role}`,
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('set-role error', err)
    return res.status(500).json({ error: 'server error', detail: err.message || err })
  }
}
