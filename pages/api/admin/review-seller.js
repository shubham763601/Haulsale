// pages/api/admin/review-seller.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]

  const adminUser = await getCallingUser(token)
  if (!adminUser) {
    return res.status(401).json({ error: 'Invalid auth token' })
  }

  // Check that caller is admin
  const { data: adminProfile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .maybeSingle()

  if (profileErr) {
    console.error('admin profile error', profileErr)
    return res.status(500).json({ error: 'server error' })
  }

  if (!adminProfile || adminProfile.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { user_id, decision } = req.body ?? {}
  if (!user_id || !decision) {
    return res.status(400).json({ error: 'user_id and decision required' })
  }

  if (!['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be approve or reject' })
  }

  try {
    if (decision === 'approve') {
      // 1) update profile to seller + approved
      const { error: upErr } = await supabaseAdmin
        .from('profiles')
        .update({
          kyc_status: 'approved',
          role: 'seller',
        })
        .eq('id', user_id)

      if (upErr) {
        console.error('update profile approve error', upErr)
        throw upErr
      }

      // 2) ensure seller row exists for this user
      const { data: existing, error: selErr } = await supabaseAdmin
        .from('sellers')
        .select('id')
        .eq('auth_user_id', user_id)
        .maybeSingle()

      if (selErr) {
        console.error('select seller error', selErr)
        throw selErr
      }

      if (!existing) {
        // fetch profile to derive shop name/email
        const { data: prof, error: profErr } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('id', user_id)
          .maybeSingle()

        if (profErr) {
          console.error('load profile for seller insert', profErr)
          // not fatal, but best to fail early
          throw profErr
        }

        const defaultShopName = prof?.full_name
          ? `${prof.full_name}'s Shop`
          : 'New Seller Shop'

        const { error: insErr } = await supabaseAdmin
          .from('sellers')
          .insert({
            auth_user_id: user_id,
            shop_name: defaultShopName,
            gstin: null,
          })

        if (insErr) {
          console.error('insert seller error', insErr)
          throw insErr
        }
      }

      return res.status(200).json({ success: true, decision: 'approve' })
    }

    if (decision === 'reject') {
      // update profile only: kyc rejected, keep role as buyer (or current)
      const { error: upErr } = await supabaseAdmin
        .from('profiles')
        .update({
          kyc_status: 'rejected',
          // if you want to force them back to buyer:
          // role: 'buyer',
        })
        .eq('id', user_id)

      if (upErr) {
        console.error('update profile reject error', upErr)
        throw upErr
      }

      return res.status(200).json({ success: true, decision: 'reject' })
    }
  } catch (err) {
    console.error('review-seller error', err)
    return res.status(500).json({ error: 'server error', detail: err.message || String(err) })
  }
}
