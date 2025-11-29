// pages/api/proxy-create-product.js
// Forwards product creation to Supabase Edge Function `create-product`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const edgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-product`

    // Forward the caller's auth token to the Edge Function
    const authHeader = req.headers.authorization || ''

    const resp = await fetch(edgeUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(req.body),
    })

    const json = await resp.json().catch(() => ({}))

    if (!resp.ok) {
      return res.status(resp.status).json(json)
    }

    return res.status(200).json(json)
  } catch (err) {
    console.error('proxy-create-product error', err)
    return res.status(500).json({ error: 'Proxy server error', detail: err.message || String(err) })
  }
}