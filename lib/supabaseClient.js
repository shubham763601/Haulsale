// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Throwing early helps catch missing env in development
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env');
}

/**
 * Public (client) Supabase instance
 * - Do NOT put service role key here
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true, // useful for OAuth redirects; set false if you get issues during SSR
  },
});

/**
 * Build a public storage URL for a given storage path.
 * Expects full path like: "bucket/path/to/file.jpg" or "public-assets/file.jpg"
 */
export function makePublicUrl(storagePath) {
  const baseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
  if (!storagePath) return null;
  if (/^https?:\/\//i.test(storagePath)) return storagePath;
  // If storagePath already contains the bucket root, return direct object path
  return `${baseUrl}/storage/v1/object/public/${storagePath}`;
}
