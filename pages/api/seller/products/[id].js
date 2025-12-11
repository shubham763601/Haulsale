// pages/api/seller/products/[id].js
import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export default async function handler(req, res) {
  const { id } = req.query;
  if (!["PUT"].includes(req.method)) return res.status(405).end();

  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing token" });

    const { data: userData, error: uErr } = await supabaseAdmin.auth.getUser(token);
    if (uErr || !userData?.user) return res.status(401).json({ error: "Invalid token" });
    const user = userData.user;

    // verify product exists and belongs to user
    const { data: pRow, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, seller_id")
      .eq("id", id)
      .maybeSingle();
    if (pErr) return res.status(500).json({ error: pErr.message });
    if (!pRow) return res.status(404).json({ error: "product_not_found" });
    if (String(pRow.seller_id) !== String(user.id)) return res.status(403).json({ error: "forbidden" });

    // apply update (only allow certain fields)
    const { title, description, price, mrp, category_id, is_active, meta } = req.body;
    const updatePayload = {
      title, description,
      price, mrp,
      category_id,
      is_active,
      meta,
      updated_at: new Date().toISOString()
    };
    // remove undefined keys
    Object.keys(updatePayload).forEach(k => updatePayload[k] === undefined && delete updatePayload[k]);

    const { data: updated, error: updErr } = await supabaseAdmin
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (updErr) return res.status(500).json({ error: updErr.message });

    return res.json({ product: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal" });
  }
}
