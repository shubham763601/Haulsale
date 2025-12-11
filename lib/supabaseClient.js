// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY ) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY,  {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// add/export function in lib/supabaseClient.js
export function makePublicUrl(storagePath) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!storagePath) return null;
  if (storagePath.startsWith("http")) return storagePath;
  return `${baseUrl}/storage/v1/object/public/${storagePath}`;
}
