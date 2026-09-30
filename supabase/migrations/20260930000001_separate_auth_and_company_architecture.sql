-- ─── Separate Auth User and Company Architecture ──────────────────────────────
-- 1. Add parent_company_id to companies table for parent-child business hierarchy
alter table public.companies
add column if not exists parent_company_id uuid references public.companies(id) on delete set null;

create index if not exists idx_companies_parent_company_id on public.companies(parent_company_id);

-- 2. Add is_primary to companies and company_members
alter table public.companies
add column if not exists is_primary boolean not null default false;

create index if not exists idx_companies_is_primary on public.companies(is_primary);

alter table public.company_members
add column if not exists is_primary boolean not null default false;

create index if not exists idx_company_members_is_primary on public.company_members(is_primary);

-- 3. Update create_owner_membership trigger to respect primary status
create or replace function public.create_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_first boolean;
begin
  select not exists (
    select 1 from public.company_members
    where user_id = new.user_id and is_active = true
  ) into v_is_first;

  insert into public.company_members (company_id, user_id, role, is_active, is_primary)
  values (new.id, new.user_id, 'Owner', true, coalesce(new.is_primary, v_is_first, false))
  on conflict (company_id, user_id) do update
    set is_primary = coalesce(excluded.is_primary, company_members.is_primary);

  insert into public.profiles (id, full_name, mobile)
  select
    new.user_id,
    coalesce(p.full_name, split_part(u.email, '@', 1), 'User'),
    p.mobile
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = new.user_id
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 4. Register user profile and primary company together atomically
create or replace function public.register_company_account(
  p_company_name text,
  p_owner_name text,
  p_mobile text default null,
  p_gst_number text default null,
  p_address text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_company_id uuid;
  v_email text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- If user already has an active primary company, return that company id
  select company_id into v_company_id
  from public.company_members
  where user_id = v_user_id and is_active = true
  order by is_primary desc, created_at asc
  limit 1;

  if v_company_id is not null then
    return v_company_id;
  end if;

  select email into v_email from auth.users where id = v_user_id;

  -- 1. Ensure profile exists and has owner name and mobile
  insert into public.profiles (id, full_name, mobile)
  values (v_user_id, coalesce(nullif(trim(p_owner_name), ''), 'User'), nullif(trim(p_mobile), ''))
  on conflict (id) do update
    set full_name = coalesce(nullif(trim(excluded.full_name), ''), profiles.full_name),
        mobile = coalesce(nullif(trim(excluded.mobile), ''), profiles.mobile),
        updated_at = now();

  -- 2. Create the user's primary company
  insert into public.companies (
    user_id, name, gst_number, address, phone, email, is_active, is_primary
  )
  values (
    v_user_id,
    trim(p_company_name),
    p_gst_number,
    p_address,
    nullif(trim(p_mobile), ''),
    v_email,
    true,
    true
  )
  returning id into v_company_id;

  -- 3. Ensure owner membership has role = 'Owner' and is_primary = true
  insert into public.company_members (company_id, user_id, role, is_active, is_primary)
  values (v_company_id, v_user_id, 'Owner', true, true)
  on conflict (company_id, user_id) do update
    set role = 'Owner', is_active = true, is_primary = true;

  -- 4. Initialize challan sequences
  insert into public.challan_sequences (company_id, last_number)
  values (v_company_id, 0)
  on conflict (company_id) do nothing;

  return v_company_id;
end;
$$;

grant execute on function public.register_company_account(text, text, text, text, text) to authenticated;

-- 5. Provision company after email confirmation using signup metadata
create or replace function public.provision_pending_company_account()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_meta jsonb;
  v_company_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Check existing active primary or member company
  select company_id into v_company_id
  from public.company_members
  where user_id = v_user_id and is_active = true
  order by is_primary desc, created_at asc
  limit 1;

  if v_company_id is not null then
    return v_company_id;
  end if;

  select raw_user_meta_data into v_meta
  from auth.users where id = v_user_id;

  if v_meta->>'company_name' is null or trim(v_meta->>'company_name') = '' then
    return null;
  end if;

  return public.register_company_account(
    trim(v_meta->>'company_name'),
    coalesce(nullif(trim(v_meta->>'full_name'), ''), nullif(trim(v_meta->>'name'), ''), 'Owner'),
    v_meta->>'mobile',
    v_meta->>'gst_number',
    coalesce(v_meta->>'company_address', v_meta->>'address')
  );
end;
$$;

grant execute on function public.provision_pending_company_account() to authenticated;



