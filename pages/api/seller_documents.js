// pages/api/seller_documents.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.warn("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token) return res.status(401).json({ error: "Missing Authorization token" });

    // Verify token -> get user id
    // Use admin client to call getUser on the token
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      console.error("Token verification failed", userErr);
      return res.status(401).json({ error: "Invalid token" });
    }
    const callerUser = userData.user;
    // parse body
    const { seller_id, doc_type, storage_path, meta } = req.body || {};
    if (!seller_id || !doc_type || !storage_path) return res.status(400).json({ error: "seller_id, doc_type and storage_path required" });

    // Verify seller exists and is owned by callerUser.id
    const { data: sRow, error: sellerErr } = await supabaseAdmin
      .from("sellers")
      .select("id, user_id")
      .eq("id", seller_id)
      .maybeSingle();

    if (sellerErr) {
      console.error("seller lookup error", sellerErr);
      return res.status(500).json({ error: "internal" });
    }
    if (!sRow) return res.status(404).json({ error: "seller_not_found" });

    if (String(sRow.user_id) !== String(callerUser.id) && callerUser.role !== "admin") {
      // allow admin if necessary (jwt.claims.role won't be available here unless token has it)
      console.warn("Caller does not own seller", { callerUser: callerUser.id, sellerUser: sRow.user_id });
      return res.status(403).json({ error: "forbidden" });
    }

    // Insert metadata with service key (bypasses RLS)
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
      return res.status(500).json({ error: insertErr.message });
    }

    return res.status(201).json({ document: data });
  } catch (err) {
    console.error("API error", err);
    return res.status(500).json({ error: "internal" });
  }
}
