insert into public.cuissons (slug, label, description, price_htg, sort_order) values
  ('frit_huile', 'Frit à l''huile', 'Pâté kòde, doré et croustillant', 150, 1),
  ('au_four', 'Au four', 'Pâte feuilletée, plus légère', 165, 2)
on conflict (slug) do nothing;

insert into public.viandes (slug, label, price_htg, sort_order) values
  ('boeuf', 'Bœuf', 25, 1),
  ('poulet', 'Poulet', 25, 2),
  ('hareng', 'Hareng', 15, 3)
on conflict (slug) do nothing;

insert into public.extras (slug, label, price_htg, sort_order) values
  ('oeuf_dur', 'Œuf dur', 35, 1),
  ('fromage', 'Fromage', 50, 2),
  ('avocat', 'Avocat', 40, 3),
  ('tomate', 'Tomate', 15, 4),
  ('pikliz', 'Pikliz maison', 20, 5),
  ('piment_bouc', 'Piment bouc', 10, 6)
on conflict (slug) do nothing;

insert into public.jus (slug, name, description, price_htg, image_path, sort_order) values
  ('mangue', 'Jus de mangue', 'Mangue francisque', 125, '/images/jus-trio.webp', 1),
  ('ananas', 'Jus d''ananas', 'Ananas pain de sucre', 125, '/images/jus-trio.webp', 2),
  ('fraise', 'Jus de fraise', 'Fraise & citron vert', 150, '/images/jus-trio.webp', 3)
on conflict (slug) do nothing;

insert into public.combos (slug, name, description, price_htg, original_price_htg, image_path, pate_viande_slug, pate_cuisson_slug, pate_count, jus_slug, jus_count, sort_order) values
  ('delis', 'Combo Délis', '1 pâté bœuf + 1 jus mangue', 250, 300, '/images/combo-hero.webp', 'boeuf', 'frit_huile', 1, 'mangue', 1, 1),
  ('duo', 'Combo Duo', '2 pâtés bœuf + 2 jus mangue, à partager', 480, 600, '/images/combo-hero.webp', 'boeuf', 'frit_huile', 2, 'mangue', 2, 2)
on conflict (slug) do nothing;

insert into public.quartiers (name, sort_order) values
  ('Centre-ville', 1),
  ('Bergeaud', 2),
  ('Gelée', 3),
  ('La Savane', 4),
  ('Quatre Chemins', 5),
  ('Tôle', 6),
  ('Nan Bourgeois', 7),
  ('Carrefour Gros Marché', 8)
on conflict (name) do nothing;
