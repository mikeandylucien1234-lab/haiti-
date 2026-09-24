-- Horaires réels : tous les jours 5h-20h (heure de Les Cayes), modifiable depuis l'admin.
update public.settings set opening_time = '05:00', closing_time = '20:00' where id = true;

-- Chaque jus a sa propre photo (extraite du prototype), au lieu de la photo commune.
update public.jus set image_path = '/images/jus-mangue.webp' where slug = 'mangue';
update public.jus set image_path = '/images/jus-ananas.webp' where slug = 'ananas';
update public.jus set image_path = '/images/jus-fraise.webp' where slug = 'fraise';
