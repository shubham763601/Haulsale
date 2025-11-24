// pages/api/verify-otp.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' })
  const { email, otp } = req.body || {}
  if (!email || !otp) return res.status(400).json({ error: 'Missing email or otp' })

  try {
    // lookup latest unused OTP for this email
    const { data, error } = await supabaseAdmin
      .from('signup_otps')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('lookup otp error', error)
      return res.status(500).json({ error: 'DB error' })
    }

    if (!data) return res.status(400).json({ error: 'No OTP found for this email' })

    const now = new Date().toISOString()
    if (data.expires_at < now) return res.status(400).json({ error: 'OTP expired' })
    if (data.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' })

    // mark used
    const { error: updErr } = await supabaseAdmin
      .from('signup_otps')
      .update({ used: true })
      .eq('id', data.id)

    if (updErr) {
      console.error('mark used error', updErr)
      // continue anyway
    }

    return res.status(200).json({ message: 'OTP verified' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}