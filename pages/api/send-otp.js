// pages/api/send-otp.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'no-reply@yourdomain.com'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.warn('Warning: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default async function handler(req, res) {
  // ensure we always send JSON header
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' })
  }

  const { email } = req.body || {}
  if (!email) {
    return res.status(400).json({ error: 'Missing email' })
  }

  try {
    const otp = genOtp()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10).toISOString()

    // insert OTP record
    const { error: insertErr } = await supabaseAdmin
      .from('signup_otps')
      .insert([{ email: email.toLowerCase(), otp, expires_at: expiresAt, used: false }])

    if (insertErr) {
      console.error('insert OTP error', insertErr)
      // return JSON error
      return res.status(500).json({ error: 'Failed to save OTP', details: insertErr.message || insertErr })
    }

    // If SendGrid is not configured, return the OTP (local/dev mode)
    if (!SENDGRID_API_KEY) {
      return res.status(200).json({ message: 'OTP saved (no sendgrid configured)', otp })
    }

    // Build SendGrid payload
    const body = {
      personalizations: [{ to: [{ email }], subject: 'Your Haulsale verification code' }],
      from: { email: FROM_EMAIL, name: 'Haulsale' },
      content: [{ type: 'text/plain', value: `Your verification code is: ${otp} (expires in 10 minutes)` }]
    }

    // Send via SendGrid (global fetch should exist on Vercel)
    const sendRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!sendRes.ok) {
      const text = await sendRes.text().catch(() => 'no-body')
      console.error('SendGrid error status', sendRes.status, text)
      return res.status(500).json({ error: 'Failed to send OTP email', status: sendRes.status, body: text })
    }

    // success
    return res.status(200).json({ message: 'OTP sent' })
  } catch (err) {
    // Catch unexpected runtime errors and always respond with JSON
    console.error('Unhandled error in send-otp:', err)
    return res.status(500).json({ error: 'Server error', details: (err && err.message) || String(err) })
  }
}
