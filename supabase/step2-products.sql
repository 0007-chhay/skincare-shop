-- ជំហានទី ២: តារាងផលិតផល + កន្លែងរក្សាទុករូបភាព
-- Copy ទាំងអស់ → Supabase → SQL Editor → New query → Paste → Run

-- ១. តារាងផលិតផល
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,             -- ឈ្មោះសម្រាប់ link (អក្សរអង់គ្លេសតូច និង -)
  name_km     text not null,                    -- ឈ្មោះខ្មែរ
  name_en     text not null default '',         -- ឈ្មោះអង់គ្លេស
  price       numeric(10,2) not null check (price >= 0), -- តម្លៃ USD
  description text not null default '',
  tag         text,                             -- ស្លាកលើរូប ឧ. លក់ដាច់ / ថ្មី (ទុកទទេបាន)
  tint        text not null default '#E3ECEA',  -- ពណ៌ផ្ទៃខាងក្រោយ
  image       text,                             -- ឈ្មោះរូបក្នុង Storage ឧ. night-cream.jpg
  concerns    text[] not null default '{}',     -- acne, dry, dark-spots, oily, sensitive
  in_stock    boolean not null default true,    -- false = បង្ហាញថា "អស់ស្តុក"
  is_active   boolean not null default true,    -- false = លាក់ពីហាង (ជំនួសការលុប)
  sort_order  integer not null default 0,       -- លេខតូចបង្ហាញមុន
  created_at  timestamptz not null default now()
);

-- ២. សុវត្ថិភាព: អតិថិជនអាន "បានតែ" ផលិតផលដែលបើកលក់
alter table public.products enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

-- ៣. កន្លែងរក្សាទុករូបផលិតផល (មើលបានជាសាធារណៈ)
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- ៤. ផលិតផលគំរូ (ពីជំហានទី ១) — តម្លៃគ្រាន់តែជាឧទាហរណ៍
insert into public.products (slug, name_km, name_en, price, description, tag, tint, concerns, sort_order) values
  ('vitamin-c-serum',   'សេរ៉ូមវីតាមីន C',          'Vitamin C Serum',  18, 'ជួយឲ្យស្បែកភ្លឺថ្លា និងបន្ថយស្នាមខ្មៅ។',      'លក់ដាច់',     '#F3E6D3', '{dark-spots}',               1),
  ('sunscreen-spf50',   'ឡេការពារកម្តៅថ្ងៃ SPF50',   'Sunscreen SPF50',  14, 'ស្រាល មិនស្អិត ល្អសម្រាប់អាកាសធាតុក្តៅ។',   'ប្រើរាល់ថ្ងៃ', '#D7EAE2', '{oily,acne,sensitive}',      2),
  ('sheet-mask',        'ម៉ាសបិទមុខ',               'Sheet Mask',        3, 'ផ្តល់សំណើមភ្លាមៗ ក្នុង ១៥ នាទី។',           'ថ្មី',        '#F2DEDE', '{dry}',                      3),
  ('hydrating-toner',   'ទឹកថ្នាំបំប៉នសំណើម',        'Hydrating Toner',  12, 'រៀបចំស្បែកឲ្យស្រូបសេរ៉ូមបានល្អ។',            null,          '#E3ECEA', '{dry,sensitive}',            4),
  ('gentle-cleanser',   'សាប៊ូលាងមុខស្រាល',          'Gentle Cleanser',  10, 'សម្អាតជ្រៅ ដោយមិនធ្វើឲ្យស្បែកស្ងួត។',        null,          '#ECE8F2', '{acne,oily,sensitive}',      5),
  ('night-cream',       'ក្រែមលាបពេលយប់',            'Night Cream',      20, 'បំប៉នស្បែកពេលអ្នកគេង។',                     null,          '#E6E2DC', '{dry}',                      6)
on conflict (slug) do nothing;
