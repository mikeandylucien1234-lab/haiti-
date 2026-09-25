-- Paiement manuel MonCash/NatCash : le client transfère lui-même l'argent vers le
-- compte de l'entreprise, puis envoie un numéro de transaction + une preuve (photo/PDF)
-- que l'admin vérifie manuellement avant de considérer la commande comme payée.
-- Rien n'est jamais confirmé automatiquement côté client.

-- Coordonnées MonCash/NatCash configurables depuis les réglages admin (jamais codées
-- en dur dans le frontend).
alter table public.settings add column if not exists moncash_name text not null default 'DELIS';
alter table public.settings add column if not exists moncash_number text not null default '50945321456';
alter table public.settings add column if not exists natcash_name text not null default 'DELIS';
alter table public.settings add column if not exists natcash_number text not null default '50945321456';

update public.settings
set moncash_name = 'DELIS', moncash_number = '50945321456', natcash_name = 'DELIS', natcash_number = '50945321456'
where id = true;

create type public.payment_status as enum (
  'not_required',        -- paiement à la livraison : rien à vérifier
  'pending_proof',        -- moncash/natcash choisi, le client n'a pas encore envoyé sa preuve
  'pending_verification', -- preuve envoyée, en attente de vérification par l'admin
  'confirmed',
  'rejected'
);

alter table public.orders add column if not exists payment_status public.payment_status not null default 'not_required';
alter table public.orders add column if not exists transaction_number text;
alter table public.orders add column if not exists payment_proof_path text;
alter table public.orders add column if not exists payment_submitted_at timestamptz;
alter table public.orders add column if not exists payment_verified_at timestamptz;
alter table public.orders add column if not exists payment_verified_by uuid references public.admins(user_id) on delete set null;

-- Un même numéro de transaction ne doit pas pouvoir servir pour deux commandes
-- différentes payées par le même moyen (moncash/natcash).
create unique index if not exists orders_transaction_number_unique
  on public.orders (payment_method, transaction_number)
  where transaction_number is not null;

-- Bucket privé (contrairement à house-photos) : une preuve de paiement est sensible,
-- seul le client propriétaire de la commande et l'admin peuvent y accéder (URL signée).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 8388608, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

drop policy if exists "payment_proofs_own_upload" on storage.objects;
drop policy if exists "payment_proofs_own_or_admin_read" on storage.objects;

create policy "payment_proofs_own_upload" on storage.objects
  for insert with check (
    bucket_id = 'payment-proofs'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "payment_proofs_own_or_admin_read" on storage.objects
  for select using (
    bucket_id = 'payment-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
