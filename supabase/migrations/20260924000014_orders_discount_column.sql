alter table public.orders add column if not exists discount_htg integer not null default 0;
alter table public.orders add column if not exists promo_code text;
