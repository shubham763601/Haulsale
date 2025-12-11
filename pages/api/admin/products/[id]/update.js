// pages/api/admin/products/[id]/update.js
import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export default async function handler(req, res) {
  if (req.method !== "PUT") return res.status(405).end();
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing token" });

    const { data: userData, error: uErr } = await supabaseAdmin.auth.getUser(token);
    if (uErr || !userData?.user) return res.status(401).json({ error: "Invalid token" });

    const role = userData.user?.user_metadata?.role || null;
    if (role !== "admin") return res.status(403).json({ error: "forbidden" });

    const { id } = req.query;
    const { product, variants = [], remove_variant_ids = [], images = [] } = req.body;

    // Update product row
    if (product) {
      const payload = { ...product, updated_at: new Date().toISOString() };
      await supabaseAdmin.from("products").update(payload).eq("id", id);
    }

    // Upsert variants (variants[] contains objects with id for existing ones)
    for (const v of variants) {
      if (v.id) {
        const { id: vid, ...rest } = v;
        await supabaseAdmin.from("product_variants").update(rest).eq("id", vid);
      } else {
        // insert new variant
        await supabaseAdmin.from("product_variants").insert({ product_id: id, ...v });
      }
    }

    // remove variants
    if (Array.isArray(remove_variant_ids) && remove_variant_ids.length) {
      await supabaseAdmin.from("product_variants").delete().in("id", remove_variant_ids);
    }

    // images: images[] contains objects { id?, storage_path, alt_text, position }
    for (const img of images) {
      if (img.id) {
        const { id: iid, ...rest } = img;
        await supabaseAdmin.from("product_images").update(rest).eq("id", iid);
      } else {
        await supabaseAdmin.from("product_images").insert({ product_id: id, ...img });
      }
    }

    const { data: updated, error: finalErr } = await supabaseAdmin.from("products").select().eq("id", id).maybeSingle();
    if (finalErr) return res.status(500).json({ error: finalErr.message });
    return res.json({ product: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal" });
  }
}
