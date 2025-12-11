// pages/api/admin/products/[id]/approve.js
import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing token" });

    // verify caller is admin: getUser & check jwt.claims.role OR check profile row if you store role there
    const { data: userData, error: uErr } = await supabaseAdmin.auth.getUser(token);
    if (uErr || !userData?.user) return res.status(401).json({ error: "Invalid token" });

    const role = userData.user?.user_metadata?.role || null;
    // If you set role in JWT claims, you could also use current_setting in SQL. For simplicity, require an admin flag in user_metadata.role === 'admin'
    if (role !== "admin") return res.status(403).json({ error: "forbidden" });

    const { id } = req.query;
    const { data, error } = await supabaseAdmin
      .from("products")
      .update({ approved: true, is_active: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ product: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal" });
  }
}
