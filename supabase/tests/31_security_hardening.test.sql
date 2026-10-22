-- Regression tests for 20261022000001_security_hardening.sql.
\set viewer '''a0000000-0000-0000-0000-000000000002'''
\set owner '''a0000000-0000-0000-0000-000000000001'''
\set co '''c0000000-0000-0000-0000-00000000000a'''

update company_members set bank_account_number = '1234567890' where user_id = 'a0000000-0000-0000-0000-000000000003';
insert into inquiries (full_name, email, message) values ('Visitor', 'v@test', 'Need 500 m grey fabric');

select tests.as_user(:viewer);
select tests.eq((select count(*)::int from company_members where company_id = :co), 1, 'staff see only their own membership row');
select tests.eq((select count(*)::int from inquiries), 0, 'non-platform-admin reads no inquiries');
update companies set user_id = 'a0000000-0000-0000-0000-000000000002' where id = :co;

select tests.as_user(:owner);
select tests.eq((select count(*)::int from company_members where company_id = :co), 5, 'owner sees the whole roster');
select tests.raises($$ update companies set user_id = 'a0000000-0000-0000-0000-000000000002' where id = 'c0000000-0000-0000-0000-00000000000a' $$,
  'cannot be changed', 'owner cannot reassign companies.user_id from the client');
select tests.eq((select user_id from companies where id = :co), 'a0000000-0000-0000-0000-000000000001'::uuid, 'staff update of companies had no effect');

select tests.as_superuser();
insert into platform_admins (user_id) values (:owner);
select tests.as_user(:owner);
select tests.eq((select count(*)::int from inquiries), 1, 'platform admin reads inquiries');

select tests.as_anon();
select tests.raises($$ select public.generate_personal_expense_number('a0000000-0000-0000-0000-000000000001') $$, 'permission denied', 'anon cannot call SECURITY DEFINER RPCs');
