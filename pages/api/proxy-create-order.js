// pages/api/proxy-create-order.js

export default async function handler(req, res) {
  const FUNCTION_URL = process.env.NEXT_PUBLIC_EDGE_CREATE_ORDER_URL;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();

    try {
      const json = JSON.parse(text);
      return res.status(response.status).json(json);
    } catch (e) {
      console.error("Invalid JSON from edge function:", text);
      return res.status(500).json({ error: "Invalid JSON from function" });
    }

  } catch (err) {
    console.error("Proxy request failed:", err);
    return res.status(500).json({ error: "Proxy error" });
  }
}
