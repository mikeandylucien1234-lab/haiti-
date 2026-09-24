-- RLS
alter table public.admins enable row level security;
alter table public.settings enable row level security;
alter table public.cuissons enable row level security;
alter table public.viandes enable row level security;
alter table public.extras enable row level security;
alter table public.jus enable row level security;
alter table public.combos enable row level security;
alter table public.quartiers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- admins: seul un admin peut se voir lui-même
create policy admins_select_self on public.admins
  for select using (public.is_admin());

-- settings: lecture publique, écriture admin
create policy settings_public_read on public.settings for select using (true);
create policy settings_admin_write on public.settings for update using (public.is_admin());

-- catalogue: lecture publique (y compris items inactifs pour l'admin, publique voit tout mais le front filtre "active" pour l'affichage; on restreint quand même l'écriture)
create policy cuissons_read on public.cuissons for select using (true);
create policy cuissons_admin_write on public.cuissons for all using (public.is_admin()) with check (public.is_admin());

create policy viandes_read on public.viandes for select using (true);
create policy viandes_admin_write on public.viandes for all using (public.is_admin()) with check (public.is_admin());

create policy extras_read on public.extras for select using (true);
create policy extras_admin_write on public.extras for all using (public.is_admin()) with check (public.is_admin());

create policy jus_read on public.jus for select using (true);
create policy jus_admin_write on public.jus for all using (public.is_admin()) with check (public.is_admin());

create policy combos_read on public.combos for select using (true);
create policy combos_admin_write on public.combos for all using (public.is_admin()) with check (public.is_admin());

create policy quartiers_read on public.quartiers for select using (true);
create policy quartiers_admin_write on public.quartiers for all using (public.is_admin()) with check (public.is_admin());

-- orders: un client anonyme ne voit que ses propres commandes ; l'admin voit tout
create policy orders_select_own_or_admin on public.orders
  for select using (customer_id = auth.uid() or public.is_admin());

-- l'insertion se fait uniquement via l'edge function (service role), jamais directement depuis le navigateur
create policy orders_admin_update on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- order_items: visibles si la commande parente est visible
create policy order_items_select on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.customer_id = auth.uid() or public.is_admin())
    )
  );

-- realtime
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
