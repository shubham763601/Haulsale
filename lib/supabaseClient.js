// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY ) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env or SUPABASE_SERVICE_ROLE_KEY')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
})
