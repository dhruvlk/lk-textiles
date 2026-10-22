-- ════════════════════════════════════════════════════════════════════════════
-- Security hardening (audit 2026-10-22)
--
-- Review before applying. Deploy the matching application code FIRST (signed
-- document URLs, employees API guards), then apply this migration.
-- Non-destructive: no tables, columns or rows are dropped.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. company_members: remove legacy Admin write policy ──────────────────
-- 20260714 created "Owners and admins can manage memberships"; 20260723 meant to
-- replace it but dropped a differently named policy, so the Admin policy is still
-- active (policies are OR-ed). An Admin could promote themselves to Owner.
drop policy if exists "Owners and admins can manage memberships" on public.company_members;

-- Roster rows carry bank account, IFSC, PAN, UAN and PF numbers. Previously any
-- active member (any Staff) could read every colleague's row. Restrict to the
-- user's own rows and company Owners. Owner tooling uses the service role or
-- list_company_employees(), which are unaffected.
drop policy if exists "Members can view company memberships" on public.company_members;
drop policy if exists "Members can read company members" on public.company_members;
create policy "Members can read company members"
  on public.company_members for select
  using (
    user_id = auth.uid()
    or public.user_has_company_role(company_id, array['Owner']::text[])
  );

-- ─── 2. companies: owners/permitted editors only; user_id is immutable ─────
-- Any active member could UPDATE companies (including user_id). Setting
-- companies.user_id to oneself was enough to pass the employees API owner check.
drop policy if exists "Members can update their companies" on public.companies;
create policy "Members can update their companies"
  on public.companies for update
  using (
    public.user_has_module_permission(id, 'companies', 'edit')
    or public.user_has_module_permission(id, 'settings', 'edit')
  )
  with check (
    public.user_has_module_permission(id, 'companies', 'edit')
    or public.user_has_module_permission(id, 'settings', 'edit')
  );

create or replace function public.prevent_company_owner_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.user_id is distinct from old.user_id
     and current_user in ('authenticated', 'anon') then
    raise exception 'companies.user_id cannot be changed from the client';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_company_owner_change on public.companies;
create trigger trg_prevent_company_owner_change
  before update on public.companies
  for each row execute function public.prevent_company_owner_change();

-- ─── 3. inquiries: platform admins only ─────────────────────────────────────
-- Inquiries come from the public landing page and have no company_id. The old
-- policies let ANY authenticated user (anyone who self-registers) read, edit
-- and delete every visitor's name, email, phone and message.
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
-- No client policies: managed with the service role / SQL editor only.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;
revoke execute on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

drop policy if exists "Authenticated users can select inquiries" on public.inquiries;
drop policy if exists "Authenticated users can update inquiries" on public.inquiries;
drop policy if exists "Authenticated users can delete inquiries" on public.inquiries;

create policy "Platform admins can select inquiries"
  on public.inquiries for select to authenticated
  using (public.is_platform_admin());
create policy "Platform admins can update inquiries"
  on public.inquiries for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
create policy "Platform admins can delete inquiries"
  on public.inquiries for delete to authenticated
  using (public.is_platform_admin());

-- REQUIRED MANUAL STEP after applying (otherwise the Inquiries page is empty):
--   insert into public.platform_admins (user_id)
--   select id from auth.users where email = '<owner login email>'
--   on conflict do nothing;

-- ─── 4. salary_slips: enforce the salary_slips module permission ───────────
-- Previously every active member could read/modify every salary slip (salary,
-- bank and PAN details) regardless of the permission matrix shown in the UI.
drop policy if exists "Members can access salary slips" on public.salary_slips;
create policy "Salary slips select" on public.salary_slips for select
  using (public.user_has_module_permission(company_id, 'salary_slips', 'view'));
create policy "Salary slips insert" on public.salary_slips for insert
  with check (public.user_has_module_permission(company_id, 'salary_slips', 'create'));
create policy "Salary slips update" on public.salary_slips for update
  using (public.user_has_module_permission(company_id, 'salary_slips', 'edit'))
  with check (public.user_has_module_permission(company_id, 'salary_slips', 'edit'));
create policy "Salary slips delete" on public.salary_slips for delete
  using (public.user_has_module_permission(company_id, 'salary_slips', 'delete'));

-- ─── 5. RPC authorization fixes ─────────────────────────────────────────────
-- `auth.uid() <> p_user_id` is NULL (not true) for anonymous callers, so the
-- check was skipped. Use IS DISTINCT FROM.
create or replace function public.generate_personal_expense_number(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text := 'PE-';
  v_next_num integer := 1;
  v_exp_number text;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     and auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized';
  end if;

  insert into public.personal_expense_settings (user_id, expense_number_prefix, starting_number, next_number)
  values (p_user_id, 'PE-', 1, 1)
  on conflict (user_id) do nothing;

  select expense_number_prefix, next_number
    into v_prefix, v_next_num
  from public.personal_expense_settings
  where user_id = p_user_id
  for update;

  v_exp_number := coalesce(v_prefix, 'PE-') || lpad(v_next_num::text, 6, '0');

  update public.personal_expense_settings
  set next_number = v_next_num + 1,
      updated_at = now()
  where user_id = p_user_id;

  return v_exp_number;
end;
$$;

-- check_company_has_data had no caller check (leaked data existence for any id).
create or replace function public.check_company_has_data(p_company_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.user_belongs_to_company(p_company_id) then
    raise exception 'Unauthorized company access';
  end if;

  return exists (select 1 from public.customers where company_id = p_company_id)
    or exists (select 1 from public.challans where company_id = p_company_id)
    or exists (select 1 from public.delivery_challans where company_id = p_company_id)
    or exists (select 1 from public.stocks where company_id = p_company_id)
    or exists (select 1 from public.products where company_id = p_company_id)
    or exists (
      select 1 from public.company_members
      where company_id = p_company_id and role <> 'Owner'
    );
end;
$$;

-- Postgres grants EXECUTE to PUBLIC by default, so `grant ... to authenticated`
-- alone still left these SECURITY DEFINER functions callable by `anon`.
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.generate_challan_number(uuid)',
    'public.generate_delivery_challan_number(uuid)',
    'public.generate_salary_slip_number(uuid, text, integer)',
    'public.generate_personal_expense_number(uuid)',
    'public.ensure_default_personal_categories(uuid)',
    'public.check_company_has_data(uuid)',
    'public.list_company_employees(uuid)',
    'public.process_challan_stock_update(uuid, uuid, jsonb, uuid)',
    'public.record_stock_movement(uuid, uuid, text, numeric, uuid, uuid, text)',
    'public.process_purchase_stock_change(uuid, uuid, numeric, text, uuid, text, uuid)',
    'public.register_company_account(text, text, text, text, text)',
    'public.provision_pending_company_account()',
    'public.user_has_module_permission(uuid, text, text)'
  ]
  loop
    begin
      execute format('revoke execute on function %s from public, anon', fn);
      execute format('grant execute on function %s to authenticated, service_role', fn);
    exception when undefined_function then
      raise notice 'Skipping missing function %', fn;
    end;
  end loop;
end;
$$;

-- process_quality_stock_change has a long signature that changed across
-- migrations; revoke from anon for every overload.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'process_quality_stock_change'
  loop
    execute format('revoke execute on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated, service_role', r.sig);
  end loop;
end;
$$;

-- ─── 6. company-documents bucket: private ───────────────────────────────────
-- Purchase bills / expense receipts were linked via getPublicUrl(). The app now
-- uses short-lived signed URLs; make sure the bucket is private so documents
-- are only readable through the member-scoped storage policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-documents',
  'company-documents',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update set public = false;
