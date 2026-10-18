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
-- Arabic name and description (optional; added after the first version).
alter table public.products add column if not exists name_ar text;
alter table public.products add column if not exists description_ar text;
-- Inventory: pieces in stock, an automatic item code and a low-stock alert level.
create sequence if not exists public.product_sku_seq;
alter table public.products add column if not exists stock int not null default 1 check (stock >= 0);
alter table public.products add column if not exists low_stock int not null default 1 check (low_stock >= 0);
alter table public.products add column if not exists sku text unique
  default ('PTG-' || lpad(nextval('public.product_sku_seq')::text, 4, '0'));
-- Pieces already marked sold have none left.
update public.products set stock = 0 where status = 'sold' and stock > 0;
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
-- "Visit us" card on the home page (added with inventory).
alter table public.settings add column if not exists address text;
alter table public.settings add column if not exists hours text;
alter table public.settings add column if not exists map_url text;
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

-- 5. Inventory: cost prices and stock history (admins only) --------------------
-- Cost prices live in their own table because products can be read by anyone.
create table if not exists public.product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost_price numeric(12, 2) not null default 0 check (cost_price >= 0) -- QAR
);
alter table public.product_costs enable row level security;
drop policy if exists "Admins manage costs" on public.product_costs;
create policy "Admins manage costs" on public.product_costs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Every change to stock: added, sold, returned or corrected, with who and when.
create table if not exists public.stock_movements (
  id           bigint generated always as identity primary key,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  sku          text,
  kind         text not null check (kind in ('added', 'sold', 'returned', 'corrected')),
  qty          int not null check (qty >= 0),  -- as entered (for "corrected": the new count)
  change       int not null,                   -- effect on stock, e.g. -1 for one sold
  stock_after  int not null,
  unit_price   numeric(12, 2),                 -- selling price at that moment
  unit_cost    numeric(12, 2),                 -- cost price at that moment
  note         text,
  by_email     text,
  created_at   timestamptz not null default now()
);
create index if not exists stock_movements_created_at on public.stock_movements (created_at);
alter table public.stock_movements enable row level security;
drop policy if exists "Admins read stock history" on public.stock_movements;
create policy "Admins read stock history" on public.stock_movements
  for select to authenticated using (public.is_admin());
-- No insert/update/delete policies: history is written only by the functions below.

-- A new product's starting stock is recorded as "added".
create or replace function public.log_new_product()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.stock > 0 then
    insert into stock_movements (product_id, product_name, sku, kind, qty, change, stock_after, unit_price, by_email)
    values (new.id, new.name, new.sku, 'added', new.stock, new.stock, new.stock, new.price, auth.jwt() ->> 'email');
  end if;
  return new;
end $$;
drop trigger if exists log_new_product on public.products;
create trigger log_new_product after insert on public.products
  for each row execute function public.log_new_product();

-- The admin page changes stock only through this, so the count and the history always agree.
create or replace function public.record_movement(p_product uuid, p_kind text, p_qty int, p_note text default null)
returns int language plpgsql security definer set search_path = public as $$
declare
  v public.products%rowtype;
  v_change int;
  v_after int;
  v_cost numeric;
begin
  if not public.is_admin() then raise exception 'Only admins can change stock.'; end if;
  select * into v from products where id = p_product for update;
  if not found then raise exception 'That product no longer exists.'; end if;
  if p_qty is null or p_qty < 0 or (p_kind <> 'corrected' and p_qty = 0) then
    raise exception 'Enter how many pieces.';
  end if;
  v_change := case p_kind
    when 'sold' then -p_qty
    when 'returned' then p_qty
    when 'added' then p_qty
    when 'corrected' then p_qty - v.stock
  end;
  if v_change is null then raise exception 'Unknown stock change.'; end if;
  v_after := v.stock + v_change;
  if v_after < 0 then raise exception 'Only % in stock.', v.stock; end if;
  select cost_price into v_cost from product_costs where product_id = p_product;
  update products set
    stock = v_after,
    status = case when v_after = 0 then 'sold' when status = 'sold' then 'available' else status end
  where id = p_product;
  insert into stock_movements (product_id, product_name, sku, kind, qty, change, stock_after, unit_price, unit_cost, note, by_email)
  values (p_product, v.name, v.sku, p_kind, p_qty, v_change, v_after, v.price, v_cost,
          nullif(trim(coalesce(p_note, '')), ''), auth.jwt() ->> 'email');
  return v_after;
end $$;
revoke execute on function public.record_movement(uuid, text, int, text) from public, anon;
grant execute on function public.record_movement(uuid, text, int, text) to authenticated;

-- 6. Add your admins ----------------------------------------------------------
-- Replace with the real email(s), one line each. These must match the users you
-- create in Authentication → Users.
-- insert into public.admins (email) values ('owner@example.com');
-- insert into public.admins (email) values ('staff@example.com');
