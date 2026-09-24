create or replace function public.next_order_number()
returns text
language sql
set search_path = public
as $$
  select 'KD-' || nextval('public.order_number_seq')::text;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.is_admin() from anon, authenticated;
