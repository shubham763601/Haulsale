// pages/api/seller/proxy-create-product.js
import { supabase } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Try getting session normally
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (sessionError) {
      console.warn('Auth session fetch warning:', sessionError.message)
    }

    const session = sessionData?.session
    if (!session?.access_token) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const token = session.access_token

    const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-product`

    const resp = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(req.body), // req.body is DIRECTLY product payload now
    })

    const text = await resp.text()
    let json
    try {
      json = text ? JSON.parse(text) : {}
    } catch (e) {
      json = { raw: text }
    }

    if (!resp.ok) {
      console.error('❌ Edge create-product Error →', json)
      return res.status(resp.status).json({
        error: json.error || 'Edge function error',
        detail: json.detail || json,
      })
    }

    return res.status(200).json(json)
  } catch (err) {
    console.error('❌ proxy-create-product failed:', err)
    return res.status(500).json({
      error: 'proxy_failed',
      detail: err.message || String(err),
    })
  }
}
