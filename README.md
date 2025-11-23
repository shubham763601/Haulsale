
# Haullcell — Swiggy-like starter (Next.js + Supabase)

This starter includes:
- Next.js frontend
- Supabase Auth (Email OTP) client integration
- API route `/api/create-seller` for creating a seller using SUPABASE_SERVICE_KEY (server)
- Basic Swiggy-like homepage with animations (Framer Motion)
- SQL schema suggestions for Supabase

## Quick setup (local / Vercel)

1. Copy this repo and install:
   ```
   npm install
   ```

2. Create a Supabase project and get:
   - `SUPABASE_URL` (project URL)
   - `SUPABASE_ANON_KEY` (public anon key)
   - `SUPABASE_SERVICE_KEY` (service_role key) — **only used server-side**

3. Create a `.env.local` at project root with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

4. Run locally:
   ```
   npm run dev
   ```

5. Deploy to Vercel:
   - Add the env vars in Vercel dashboard.
   - Push to GitHub and connect project.

## Database
See `sql/schema.sql` for suggested tables (profiles, sellers, products, product_images, product_variants, orders, order_items, payments).
Adapt to your RLS strategy. The starter expects:
- auth.users provided by Supabase Auth
- `profiles` table with `id uuid references auth.users(id)` for user metadata
- `sellers` table linking `auth_user_id uuid references auth.users(id)`

## Important
Email OTP requires Supabase project's email setup (SMTP / email provider). Without it, OTP may fail to send.
