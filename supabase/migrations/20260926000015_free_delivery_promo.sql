alter table public.promo_codes add column if not exists free_delivery boolean not null default false;

insert into public.promo_codes (code, discount_htg, description, free_delivery)
values ('BIENVENUE', 0, 'Livraison gratuite — première commande en ligne', true)
on conflict (code) do nothing;
