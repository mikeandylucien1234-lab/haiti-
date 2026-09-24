-- Bucket public pour les photos de maison (aide le livreur à trouver l'adresse).
-- Public en lecture : c'est juste une photo de façade, faible sensibilité.
-- Écriture : uniquement dans son propre dossier (préfixé par customer_id).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('house-photos', 'house-photos', true, 5242880, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

drop policy if exists "house_photos_public_read" on storage.objects;
drop policy if exists "house_photos_own_upload" on storage.objects;

create policy "house_photos_public_read" on storage.objects
  for select using (bucket_id = 'house-photos');

create policy "house_photos_own_upload" on storage.objects
  for insert with check (
    bucket_id = 'house-photos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
