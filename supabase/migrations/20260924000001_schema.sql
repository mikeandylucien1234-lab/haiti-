-- Kreyòl Délis — schéma initial
-- Identité client: Supabase Auth anonyme (auth.uid() par navigateur, aucun mot de passe).
-- Identité admin: Supabase Auth email/password + table admins.

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Réglages globaux (une seule ligne)
create table if not exists public.settings (
  id boolean primary key default true check (id = true),
  store_open boolean not null default true,
  opening_time time not null default '09:00',
  closing_time time not null default '19:00',
  timezone text not null default 'America/Port-au-Prince',
  delivery_fee_htg integer not null default 100,
  extra_viande_portion_htg integer not null default 40,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (true) on conflict do nothing;

-- Cuissons du pâté (Frit à l'huile, Au four)
create table if not exists public.cuissons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  description text not null default '',
  price_htg integer not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

-- Viandes du pâté
create table if not exists public.viandes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  price_htg integer not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

-- Extras du pâté
create table if not exists public.extras (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  price_htg integer not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

-- Jus naturels
create table if not exists public.jus (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  price_htg integer not null,
  image_path text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true
);

-- Combos (composition fixe, non modifiable par le client)
create table if not exists public.combos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  price_htg integer not null,
  original_price_htg integer not null,
  image_path text not null default '',
  -- composition figée: référence directe pour affichage/calcul
  pate_viande_slug text not null,
  pate_cuisson_slug text not null,
  pate_count integer not null default 1,
  jus_slug text not null,
  jus_count integer not null default 1,
  sort_order integer not null default 0,
  active boolean not null default true
);

-- Quartiers de livraison aux Cayes
create table if not exists public.quartiers (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create type public.payment_method as enum ('moncash', 'natcash', 'cash');
create type public.order_status as enum ('received', 'preparing', 'delivering', 'delivered');

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid not null default auth.uid(),
  customer_name text not null,
  phone text not null,
  quartier text not null,
  address text not null,
  landmark text not null default '',
  lat double precision,
  lng double precision,
  location_source text not null default 'manual', -- 'gps' ou 'manual'
  payment_method public.payment_method not null,
  status public.order_status not null default 'received',
  subtotal_htg integer not null,
  delivery_fee_htg integer not null,
  total_htg integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_type text not null, -- 'pate' | 'jus' | 'combo'
  label text not null,
  detail text not null default '',
  unit_price_htg integer not null,
  quantity integer not null default 1,
  config jsonb not null default '{}'::jsonb
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- Compteur séquentiel pour numéros de commande
create sequence if not exists public.order_number_seq start 4000;

create or replace function public.next_order_number()
returns text
language sql
as $$
  select 'KD-' || nextval('public.order_number_seq')::text;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at before update on public.settings
  for each row execute function public.set_updated_at();
