// pages/api/send-otp.js
// Serverless function: create OTP in DB and send email via SendGrid

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'no-reply@yourdomain.com'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.warn('Missing supabase env in send-otp')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString() // 6-digit
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' })
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Missing email' })

  try {
    const otp = genOtp()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10).toISOString() // 10 minutes

    // insert OTP record using service role (server-side)
    const { error: insertErr } = await supabaseAdmin
      .from('signup_otps')
      .insert([{ email: email.toLowerCase(), otp, expires_at: expiresAt, used: false }])

    if (insertErr) {
      console.error('insert OTP error', insertErr)
      return res.status(500).json({ error: 'Failed to save OTP' })
    }

    // If SendGrid is not configured, return the OTP in the response for local testing only.
    if (!SENDGRID_API_KEY) {
      return res.status(200).json({ message: 'OTP saved (no sendgrid configured)', otp })
    }

    // Build email content using a template literal (correct syntax)
    const body = {
      personalizations: [
        { to: [{ email }], subject: 'Your Haulsale verification code' }
      ],
      from: { email: FROM_EMAIL, name: 'Haulsale' },
      content: [
        { type: 'text/plain', value: `Your verification code is: ${otp} (expires in 10 minutes)` }
      ]
    }

    // Use global fetch (available on Vercel). If you prefer node-fetch, keep import and use it.
    const sendRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!sendRes.ok) {
      const text = await sendRes.text()
      console.error('SendGrid error', text)
      return res.status(500).json({ error: 'Failed to send OTP email' })
    }

    return res.status(200).json({ message: 'OTP sent' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
