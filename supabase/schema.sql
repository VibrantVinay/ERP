-- Run this once in Supabase Dashboard → SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Rift Restaurant',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_memberships (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','manager','staff')),
  created_at timestamptz not null default now(),
  primary key (restaurant_id, user_id)
);

create table if not exists public.restaurant_records (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  module_key text not null,
  cells jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists restaurant_records_tenant_module_idx on public.restaurant_records (restaurant_id, module_key, created_at desc);

create table if not exists public.restaurant_audit (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  action text not null,
  module_key text not null,
  record_id text,
  actor text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists restaurant_audit_tenant_created_idx on public.restaurant_audit (restaurant_id, created_at desc);

create or replace function public.touch_restaurant_record()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists restaurant_records_touch_updated_at on public.restaurant_records;
create trigger restaurant_records_touch_updated_at
  before update on public.restaurant_records
  for each row execute function public.touch_restaurant_record();

create or replace function public.touch_restaurant_record()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists restaurant_records_touch_updated_at on public.restaurant_records;
create trigger restaurant_records_touch_updated_at
  before update on public.restaurant_records
  for each row execute function public.touch_restaurant_record();

alter table public.restaurants enable row level security;
alter table public.restaurant_memberships enable row level security;
alter table public.restaurant_records enable row level security;
alter table public.restaurant_audit enable row level security;

drop policy if exists "Members can read restaurants" on public.restaurants;
create policy "Members can read restaurants" on public.restaurants for select to authenticated
  using (exists (select 1 from public.restaurant_memberships m where m.restaurant_id = id and m.user_id = (select auth.uid())));
drop policy if exists "Users can read own memberships" on public.restaurant_memberships;
create policy "Users can read own memberships" on public.restaurant_memberships for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Members can manage restaurant records" on public.restaurant_records;
create policy "Members can manage restaurant records" on public.restaurant_records for all to authenticated
  using (exists (select 1 from public.restaurant_memberships m where m.restaurant_id = restaurant_records.restaurant_id and m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.restaurant_memberships m where m.restaurant_id = restaurant_records.restaurant_id and m.user_id = (select auth.uid())));
drop policy if exists "Members can manage restaurant audit" on public.restaurant_audit;
create policy "Members can manage restaurant audit" on public.restaurant_audit for all to authenticated
  using (exists (select 1 from public.restaurant_memberships m where m.restaurant_id = restaurant_audit.restaurant_id and m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.restaurant_memberships m where m.restaurant_id = restaurant_audit.restaurant_id and m.user_id = (select auth.uid())));

create or replace function public.get_or_create_restaurant()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select m.restaurant_id into selected_id
    from public.restaurant_memberships m
    where m.user_id = auth.uid()
    order by m.created_at
    limit 1;
  if selected_id is null then
    insert into public.restaurants (name, created_by)
      values ('Rift Restaurant', auth.uid()) returning id into selected_id;
    insert into public.restaurant_memberships (restaurant_id, user_id, role)
      values (selected_id, auth.uid(), 'owner');
  end if;
  return selected_id;
end;
$$;
revoke all on function public.get_or_create_restaurant() from public, anon;
grant execute on function public.get_or_create_restaurant() to authenticated;

grant select on public.restaurants, public.restaurant_memberships to authenticated;
grant select, insert, update, delete on public.restaurant_records, public.restaurant_audit to authenticated;
