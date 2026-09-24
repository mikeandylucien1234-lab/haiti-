-- Aligné sur le prototype : le Combo Délis laisse le client choisir son jus
-- (mangue/ananas/fraise) ; le Combo Duo reste figé (2 jus de mangue).
alter table public.combos add column if not exists jus_choice_allowed boolean not null default false;
update public.combos set jus_choice_allowed = true where slug = 'delis';
update public.combos set jus_choice_allowed = false where slug = 'duo';
update public.combos set description = '1 pâté bœuf + 1 jus au choix' where slug = 'delis';
