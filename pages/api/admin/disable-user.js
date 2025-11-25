// pages/api/admin/disable-user.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

/**
 * Returns user object when given a valid access token.
 * Using the service-role client is fine here because we are only
 * verifying the token to identify the caller.
 */
async function getCallingUser(token) {
  if (!token) return null
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error) {
    console.error('getCallingUser error', error)
    return null
  }
  return data?.user ?? null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]

  const adminUser = await getCallingUser(token)
  if (!adminUser) return res.status(401).json({ code: 401, message: 'Invalid auth token' })

  // ensure the caller is an admin by checking profiles.role
  const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .maybeSingle()

  if (adminProfileError) {
    console.error('adminProfile query error', adminProfileError)
    return res.status(500).json({ error: 'server error' })
  }

  if (!adminProfile || adminProfile.role !== 'admin') {
    return res.status(403).json({ code: 403, message: 'Forbidden' })
  }

  const { user_id, disable, note } = req.body ?? {}
  if (!user_id || typeof disable === 'undefined') {
    return res.status(400).json({ error: 'user_id and disable required' })
  }

  try {
    // NOTE: if your profiles table uses a different column name (e.g. is_disabled),
    // change the object below to match your schema: { is_disabled: disable }
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ disabled: disable }) // <-- no SQL-style comment here
      .eq('id', user_id)

    if (updateError) {
      console.error('profiles update error', updateError)
      throw updateError
    }

    // record administrative audit
    const { error: auditError } = await supabaseAdmin.from('admin_audit').insert({
      admin_id: adminUser.id,
      target_user_id: user_id,
      action: disable ? 'disable_user' : 'enable_user',
      note: note || '',
      created_at: new Date().toISOString(),
    })

    if (auditError) {
      console.error('admin_audit insert error', auditError)
      // don't fail the whole request on audit failure, but inform
      return res.status(200).json({ success: true, audit: false, warning: auditError.message })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('disable-user error', err)
    return res.status(500).json({ error: 'server error', detail: err?.message || String(err) })
  }
}
