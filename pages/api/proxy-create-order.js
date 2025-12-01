// pages/api/proxy-create-order.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get token from Authorization header sent by the browser
    const authHeader = req.headers.authorization || req.headers.Authorization || ''
    const token = authHeader.replace('Bearer', '').trim()

    if (!token) {
      return res.status(401).json({ error: 'not_authenticated' })
    }

    const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-order`

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
      console.error('Edge create-order error:', json)
      return res.status(resp.status).json(json)
    }

    return res.status(200).json(json)
  } catch (err) {
    console.error('Proxy create-order failed', err)
    return res.status(500).json({
      error: 'proxy_failed',
      message: err.message || String(err),
    })
  }
}
