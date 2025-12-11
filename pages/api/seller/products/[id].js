// pages/api/seller/products/[id].js
import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing token" });

    const { data: uData, error: uErr } = await supabaseAdmin.auth.getUser(token);
    if (uErr || !uData?.user) return res.status(401).json({ error: "Invalid token" });
    const user = uData.user;

    // verify product belongs to user
    const { data: row } = await supabaseAdmin.from("products").select("id,seller_id").eq("id", id).maybeSingle();
    if (!row) return res.status(404).json({ error: "not_found" });
    if (String(row.seller_id) !== String(user.id)) return res.status(403).json({ error: "forbidden" });

    const { title, description, price, mrp, category_id, is_active, meta } = req.body;
    const payload = { updated_at: new Date().toISOString() };
    if (title !== undefined) payload.title = title;
    if (description !== undefined) payload.description = description;
    if (price !== undefined) payload.price = price;
    if (mrp !== undefined) payload.mrp = mrp;
    if (category_id !== undefined) payload.category_id = category_id;
    if (is_active !== undefined) payload.is_active = is_active;
    if (meta !== undefined) payload.meta = meta;

    const { data, error } = await supabaseAdmin.from("products").update(payload).eq("id", id).select().maybeSingle();
    if (error) return res.status(500).json({ error: error.message });

    return res.json({ product: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal" });
  }
}
