// pages/api/proxy-create-order.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = req.body
  try {
    const SUPABASE_FUNCTION_URL = process.env.SUPABASE_FUNCTIONS_URL // example: https://<project>.functions.supabase.co
    const FUNCTION_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    const r = await fetch(`${SUPABASE_FUNCTION_URL}/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FUNCTION_KEY}`
      },
      body: JSON.stringify(body)
    })
    const j = await r.json()
    return res.status(r.status).json(j)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'proxy error' })
  }
}
