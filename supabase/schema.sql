-- Past Times Gems database setup.
-- Paste this whole file into Supabase → SQL Editor → New query, then press Run.
-- It is safe to run again; it only creates what is missing.

-- 1. Who is allowed into the admin page --------------------------------------
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
-- No policies on purpose: the list can only be changed from this SQL editor.

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- 2. Products ---------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null check (category in ('jewellery', 'gems', 'pearls')),
  description text,
  price       numeric(12, 2) not null default 0 check (price >= 0), -- QAR
  image_url   text,
  material    text,
  weight      text,
  origin      text,
  status      text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  featured    boolean not null default false,
  visible     boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.products enable row level security;

drop policy if exists "Shoppers see visible products" on public.products;
create policy "Shoppers see visible products" on public.products
  for select using (visible or public.is_admin());

drop policy if exists "Admins add products" on public.products;
create policy "Admins add products" on public.products
  for insert to authenticated with check (public.is_admin());

drop policy if exists "Admins edit products" on public.products;
create policy "Admins edit products" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins delete products" on public.products;
create policy "Admins delete products" on public.products
  for delete to authenticated using (public.is_admin());

-- 3. Shop settings (one row) --------------------------------------------------
create table if not exists public.settings (
  id              int primary key default 1 check (id = 1),
  whatsapp_number text,
  announcement    text,
  instagram       text
);
insert into public.settings (id) values (1) on conflict do nothing;
alter table public.settings enable row level security;

drop policy if exists "Anyone reads settings" on public.settings;
create policy "Anyone reads settings" on public.settings for select using (true);

drop policy if exists "Admins insert settings" on public.settings;
create policy "Admins insert settings" on public.settings
  for insert to authenticated with check (public.is_admin());

drop policy if exists "Admins update settings" on public.settings;
create policy "Admins update settings" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 4. Product photos -----------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Anyone views product photos" on storage.objects;
create policy "Anyone views product photos" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "Admins upload product photos" on storage.objects;
create policy "Admins upload product photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins change product photos" on storage.objects;
create policy "Admins change product photos" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins delete product photos" on storage.objects;
create policy "Admins delete product photos" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- 5. Add your admins ----------------------------------------------------------
-- Replace with the real email(s), one line each. These must match the users you
-- create in Authentication → Users.
-- insert into public.admins (email) values ('owner@example.com');
-- insert into public.admins (email) values ('staff@example.com');
