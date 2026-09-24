alter table public.settings add column if not exists tiktok_url text;
alter table public.settings add column if not exists instagram_url text;

create table if not exists public.promo_codes (
  code text primary key,
  discount_htg integer not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.promo_codes(code),
  customer_id uuid not null,
  phone text not null,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists promo_redemptions_customer_idx on public.promo_code_redemptions (code, customer_id);
create index if not exists promo_redemptions_phone_idx on public.promo_code_redemptions (code, phone);

insert into public.promo_codes (code, discount_htg, description)
values ('SOCIAL25', 25, 'Abonnement TikTok/Instagram — 25 HTG de remise')
on conflict (code) do nothing;

alter table public.promo_codes enable row level security;
alter table public.promo_code_redemptions enable row level security;

create policy promo_codes_read on public.promo_codes for select using (active);
create policy promo_codes_admin_write on public.promo_codes for all using (public.is_admin()) with check (public.is_admin());

-- Les rédemptions ne sont jamais lues/écrites directement par le client :
-- seule l'Edge Function (clé service) peut y écrire ; l'admin peut consulter.
create policy promo_redemptions_admin_read on public.promo_code_redemptions for select using (public.is_admin());
