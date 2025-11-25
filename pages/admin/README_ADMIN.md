# Haulcell Admin Setup & Deploy Instructions

## 1) Run SQL migration
- Open Supabase dashboard > SQL Editor > New Query
- Paste the contents of `sql/admin_migration.sql` and run it.

## 2) Add env vars (Vercel/Netlify)
- NEXT_PUBLIC_SUPABASE_URL: your project URL (example: https://xyz.supabase.co)
- NEXT_PUBLIC_SUPABASE_ANON_KEY: (already used by frontend)
- SUPABASE_SERVICE_ROLE_KEY: Supabase service_role key (set this as secret)

## 3) Add server API files (pages/api/admin/*.js)
- Add the three files: set-role.js, toggle-seller-approval.js, disable-user.js
- If you use Netlify, make sure serverless is supported and env var is present.

## 4) Add admin UI pages
- Add pages under `pages/admin/*` as provided (index.js, users.js, sellers.js, orders.js)

## 5) Seed an admin
- After SQL ran, set at least one admin manually:
  - In Supabase Table Editor > profiles, find your user row and set `role = 'admin'`
  - Or run: `UPDATE public.profiles SET role='admin' WHERE id='your-user-uuid';`

## 6) Test admin
- Log in as that admin user in the app.
- Visit `/admin/index`, `/admin/users`, `/admin/sellers`, `/admin/orders`
- Use the UI to set role / approve sellers.

## 7) Notes & Security
- Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code.
- All admin APIs require the caller to present a valid access token in `Authorization: Bearer <token>`.
- Admin APIs use server-side service role to bypass RLS safely.
