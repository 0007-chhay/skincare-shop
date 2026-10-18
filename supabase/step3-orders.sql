-- ជំហានទី ៣: Order + សំណួរ + ព័ត៌មានបន្ថែមលើផលិតផល
-- Supabase → SQL Editor → New query → Paste → Run
-- (SQL នេះមិនលុប ឬកែទិន្នន័យដែលមានស្រាប់ទេ — វាគ្រាន់តែបន្ថែម)

-- ១. ព័ត៌មានបន្ថែមសម្រាប់ទំព័រលម្អិតផលិតផល (ទុកទទេបាន)
alter table public.products add column if not exists how_to_use  text;  -- របៀបប្រើ
alter table public.products add column if not exists ingredients text;  -- គ្រឿងផ្សំសំខាន់ៗ
alter table public.products add column if not exists size        text;  -- ចំណុះ ឧ. 30ml

-- ២. តារាង Order
create table if not exists public.orders (
  id             bigint generated always as identity primary key,  -- លេខ order (#1, #2, ...)
  created_at     timestamptz not null default now(),
  customer_name  text not null,
  phone          text not null,
  telegram       text,
  province       text not null,
  address        text not null,
  map_link       text,
  payment_method text not null check (payment_method in ('khqr', 'cod')),
  note           text,
  items          jsonb not null,            -- [{slug, name, price, qty}]
  subtotal       numeric(10,2) not null,
  delivery_fee   numeric(10,2) not null default 0,
  total          numeric(10,2) not null,
  status         text not null default 'new'
                 check (status in ('new', 'confirmed', 'paid', 'delivering', 'done', 'cancelled'))
);

-- ៣. តារាងសំណួរពីអតិថិជន
create table if not exists public.questions (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  product_slug text,
  name         text not null,
  contact      text not null,               -- លេខទូរស័ព្ទ ឬ Telegram
  message      text not null,
  status       text not null default 'new' check (status in ('new', 'answered'))
);

-- ៤. សុវត្ថិភាព: បិទការចូលដំណើរការពីខាងក្រៅទាំងស្រុង
--    មានតែ server របស់ហាង (ប្រើ Secret key) ទេដែលអាចសរសេរ/អាន
alter table public.orders    enable row level security;
alter table public.questions enable row level security;
-- (ចេតនាមិនបង្កើត policy — អតិថិជនមិនអាចមើល order របស់អ្នកដទៃបានទេ)
