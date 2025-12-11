// pages/api/seller_documents.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.warn("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL env");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

// optional: to verify the caller is the seller owner, we can accept session cookie and use anon client to get user id
// but easiest: require client to pass Authorization header with user's access_token (optional)
// For now, we will accept requests and verify seller exists and optionally leave additional checks to you.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { seller_id, doc_type, storage_path, meta } = req.body;
    if (!seller_id || !doc_type || !storage_path) return res.status(400).json({ error: "seller_id, doc_type, storage_path required" });

    // Verify seller exists
    const { data: sellerRow, error: sellerErr } = await supabaseAdmin
      .from("sellers")
      .select("id, user_id")
      .eq("id", seller_id)
      .maybeSingle();

    if (sellerErr) {
      console.error("seller lookup error", sellerErr);
      return res.status(500).json({ error: "internal" });
    }
    if (!sellerRow) return res.status(404).json({ error: "seller_not_found" });

    // Optional: verify caller identity against sellerRow.user_id
    // If using cookie-based session: parse cookie and get user id via supabaseAdmin.auth.getUserByCookie(req)
    // For now we skip that extra verification, but you should add it to prevent abuse.

    // Insert using service role (bypasses RLS)
    const { data, error: insertErr } = await supabaseAdmin
      .from("seller_documents")
      .insert({
        seller_id,
        doc_type,
        storage_path,
        meta: meta || {}
      })
      .select()
      .maybeSingle();

    if (insertErr) {
      console.error("server insert error", insertErr);
      return res.status(500).json({ error: insertErr.message || "insert_failed" });
    }

    return res.status(201).json({ document: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal" });
  }
}
