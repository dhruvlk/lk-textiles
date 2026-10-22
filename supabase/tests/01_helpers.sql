-- Test helpers (test database only). Each test file runs inside a transaction
-- that is rolled back, so fixtures never leak between files.
create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;

-- Act as a signed-in user for the rest of the transaction.
create or replace function tests.as_user(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create or replace function tests.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
end $$;

create or replace function tests.as_superuser() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function tests.eq(p_actual anyelement, p_expected anyelement, p_label text) returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FAIL %: expected %, got %', p_label, p_expected, p_actual;
  end if;
  raise notice 'ok - %', p_label;
end $$;

-- Asserts that running p_sql raises an error whose message contains p_like.
create or replace function tests.raises(p_sql text, p_like text, p_label text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if position(lower(p_like) in lower(sqlerrm)) > 0 then
      raise notice 'ok - % (raised: %)', p_label, sqlerrm;
      return;
    end if;
    raise exception 'FAIL %: raised "%" but expected "%"', p_label, sqlerrm, p_like;
  end;
  raise exception 'FAIL %: expected an error containing "%"', p_label, p_like;
end $$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

-- ─── Fixtures: two companies, an owner each, staff with different rights ─────
-- Fixed ids keep test files readable.
create or replace function tests.seed() returns void language plpgsql as $$
begin
  insert into auth.users (id, email) values
    ('a0000000-0000-0000-0000-000000000001', 'owner-a@test'),
    ('a0000000-0000-0000-0000-000000000002', 'viewer-a@test'),
    ('a0000000-0000-0000-0000-000000000003', 'clerk-a@test'),
    ('a0000000-0000-0000-0000-000000000004', 'accountant-a@test'),
    ('a0000000-0000-0000-0000-000000000005', 'creator-a@test'),
    ('b0000000-0000-0000-0000-000000000001', 'owner-b@test');

  -- create_owner_membership() adds the Owner row.
  insert into public.companies (id, user_id, name) values
    ('c0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000001', 'Company A'),
    ('c0000000-0000-0000-0000-00000000000b', 'b0000000-0000-0000-0000-000000000001', 'Company B');

  insert into public.company_members (company_id, user_id, role, is_active) values
    ('c0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000002', 'Staff', true),
    ('c0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000003', 'Staff', true),
    ('c0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000004', 'Accountant', true),
    ('c0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000005', 'Staff', true);

  -- viewer: view-only on every business module; clerk: full rights on them;
  -- creator: view + create only.
  insert into public.employee_permissions (company_id, user_id, module, can_view, can_create, can_edit, can_delete, can_export)
  select 'c0000000-0000-0000-0000-00000000000a', u.id, m.module, true, u.can_create, u.full_access, u.full_access, false
  from (values ('a0000000-0000-0000-0000-000000000002'::uuid, false, false),
               ('a0000000-0000-0000-0000-000000000003'::uuid, true, true),
               ('a0000000-0000-0000-0000-000000000005'::uuid, true, false)) as u(id, can_create, full_access)
  cross join (values ('dashboard'), ('customers'), ('invoices'), ('delivery_challans'),
                     ('stock'), ('purchases'), ('reports'), ('companies')) as m(module);

  insert into public.customers (id, company_id, name) values
    ('d0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a', 'Customer A'),
    ('d0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-00000000000b', 'Customer B');

  insert into public.stocks (id, company_id, quality_name, total_taka, sold_taka, available_taka) values
    ('e0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a', 'Quality A1', 20, 0, 20),
    ('e0000000-0000-0000-0000-00000000000c', 'c0000000-0000-0000-0000-00000000000a', 'Quality A2', 10, 0, 10),
    ('e0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-00000000000b', 'Quality B1', 5, 0, 5);
end $$;
