
-- Suggested schema for Supabase (adapt and run in SQL editor)
-- Uses auth.users UUID from Supabase's auth

create table if not exists profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  email text,
  phone text,
  role varchar(50) default 'buyer',
  kyc_status varchar(50) default 'pending',
  gstin varchar(50),
  business_name varchar(200),
  created_at timestamptz default now()
);

create table if not exists sellers (
  id bigint generated always as identity primary key,
  auth_user_id uuid references auth.users(id),
  shop_name varchar(200),
  gstin varchar(50),
  bank_account text,
  rating numeric default 0,
  created_at timestamptz default now()
);

create table if not exists categories (
  id bigint generated always as identity primary key,
  name varchar(200),
  slug varchar(200),
  parent_id bigint references categories(id)
);

create table if not exists products (
  id bigint generated always as identity primary key,
  seller_id bigint references sellers(id),
  title varchar(400),
  description text,
  sku varchar(200),
  category_id bigint references categories(id),
  base_price numeric,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists product_images (
  id bigint generated always as identity primary key,
  product_id bigint references products(id) on delete cascade,
  storage_path text,
  alt_text text,
  position int default 0
);

create table if not exists product_variants (
  id bigint generated always as identity primary key,
  product_id bigint references products(id) on delete cascade,
  pack_size varchar(100),
  unit_price numeric,
  moq integer default 1,
  stock_quantity integer default 0
);

create table if not exists orders (
  id bigint generated always as identity primary key,
  buyer_id uuid references auth.users(id),
  seller_id bigint references sellers(id),
  status varchar(100) default 'created',
  total_amount numeric,
  shipping_amount numeric,
  payment_status varchar(50) default 'pending',
  created_at timestamptz default now()
);

create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id bigint references orders(id) on delete cascade,
  product_variant_id bigint references product_variants(id),
  quantity integer,
  price_per_unit numeric
);

create table if not exists payments (
  id bigint generated always as identity primary key,
  order_id bigint references orders(id),
  amount numeric,
  gateway varchar(200),
  gateway_reference varchar(400),
  status varchar(100),
  created_at timestamptz default now()
);

-- Add RLS policies separately after verifying column types and relations.
