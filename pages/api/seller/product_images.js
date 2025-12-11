// pages/api/seller/product_images.js
import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing token" });

    const { data: uData, error: uErr } = await supabaseAdmin.auth.getUser(token);
    if (uErr || !uData?.user) return res.status(401).json({ error: "Invalid token" });
    const user = uData.user;

    const { product_id, storage_path, alt_text, position } = req.body;
    if (!product_id || !storage_path) return res.status(400).json({ error: "product_id and storage_path required" });

    // verify ownership of product
    const { data: p } = await supabaseAdmin.from("products").select("id,seller_id").eq("id", product_id).maybeSingle();
    if (!p) return res.status(404).json({ error: "product_not_found" });
    if (String(p.seller_id) !== String(user.id)) return res.status(403).json({ error: "forbidden" });

    const { data, error } = await supabaseAdmin
      .from("product_images")
      .insert({ product_id, storage_path, alt_text: alt_text || null, position: position || 0 })
      .select()
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ image: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal" });
  }
}
