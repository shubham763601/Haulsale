// pages/api/proxy-create-order.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers.authorization
  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header' })
  }

  try {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,    // ⭐ Pass through from client
        },
        body: JSON.stringify(req.body),
      }
    )

    const text = await resp.text()
    let json = {}
    try { json = JSON.parse(text) } catch {}

    if (!resp.ok) {
      return res.status(resp.status).json(json)
    }

    return res.status(200).json(json)

  } catch (err) {
    console.error('Proxy error:', err)
    return res.status(500).json({ error: 'Proxy failed' })
  }
}
