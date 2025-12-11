// pages/api/seller/products/index.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing token" });

    const { data: userData, error: uErr } = await supabaseAdmin.auth.getUser(token);
    if (uErr || !userData?.user) return res.status(401).json({ error: "Invalid token" });
    const user = userData.user;

    // seller payload (only allow fields that exist)
    const {
      title, description, price, mrp, category_id, meta, is_active, product_variants
    } = req.body;

    // Create product row as draft: approved = false
    const { data: product, error: pErr } = await supabaseAdmin
      .from("products")
      .insert([{
        title,
        description,
        price: price ?? 0,
        mrp: mrp ?? null,
        category_id: category_id ?? null,
        seller_id: user.id,
        is_active: is_active ?? false,
        approved: false,
        meta: meta ?? {}
      }])
      .select()
      .maybeSingle();

    if (pErr) return res.status(500).json({ error: pErr.message });

    // Insert variants if provided
    if (Array.isArray(product_variants) && product_variants.length) {
      const variantsToInsert = product_variants.map(v => ({
        product_id: product.id,
        moq: v.moq ?? null,
        price: v.price ?? 0,
        stock: v.stock ?? null,
        sku: v.sku ?? null,
        meta: v.meta ?? {}
      }));
      const { data: vData, error: vErr } = await supabaseAdmin.from("product_variants").insert(variantsToInsert).select();
      if (vErr) console.error("variant insert error", vErr);
    }

    return res.status(201).json({ product });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal" });
  }
}
