// pages/api/seller/create-product.js
import { supabase } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get current session so we can forward the JWT to the Edge Function
    const { data, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('getSession error', sessionError)
      return res.status(500).json({ error: 'auth_session_failed', detail: sessionError.message })
    }

    const session = data?.session
    if (!session) {
      return res.status(401).json({ error: 'not_authenticated' })
    }

    const token = session.access_token

    const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-product`

    const resp = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(req.body),
    })

    const text = await resp.text()
    let json
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { raw: text }
    }

    if (!resp.ok) {
      console.error('Edge create-product error:', json)
      return res.status(resp.status).json(json)
    }

    return res.status(200).json(json)
  } catch (err) {
    console.error('Proxy create-product failed', err)
    return res.status(500).json({
      error: 'proxy_failed',
      message: err.message || String(err),
    })
  }
}