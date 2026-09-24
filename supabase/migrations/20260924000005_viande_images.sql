alter table public.viandes add column if not exists image_path text not null default '/images/pate-hero.webp';
update public.viandes set image_path = '/images/pate-boeuf.webp' where slug = 'boeuf';
update public.viandes set image_path = '/images/pate-poulet.webp' where slug = 'poulet';
update public.viandes set image_path = '/images/pate-hareng.webp' where slug = 'hareng';
