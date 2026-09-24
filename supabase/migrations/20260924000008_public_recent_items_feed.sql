-- Fil "Commandés récemment" : vrai historique de TOUS les clients, mais anonymisé
-- (aucun nom, téléphone, adresse ni identifiant client) pour ne pas exposer de PII
-- publiquement tout en respectant "un client ne voit pas les commandes des autres".
--
-- security_invoker=false (valeur par défaut) : la vue tourne avec les droits de
-- son propriétaire (postgres) et contourne donc la RLS des tables sources orders/
-- order_items pour la lecture — mais la vue elle-même n'expose QUE des colonnes
-- non identifiantes.
create or replace view public.recent_order_items_feed
as
select
  oi.id,
  oi.item_type,
  oi.label,
  oi.detail,
  oi.unit_price_htg,
  oi.config,
  o.created_at
from public.order_items oi
join public.orders o on o.id = oi.order_id
order by o.created_at desc
limit 30;

grant select on public.recent_order_items_feed to anon, authenticated;
