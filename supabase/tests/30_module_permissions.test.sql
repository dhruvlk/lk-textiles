-- SEC-001: the permission matrix is enforced for writes; reads stay member-wide.
-- viewer = view-only on every module · clerk = create/edit/delete ·
-- accountant = legacy role with no matrix (keeps access, decision K-1) ·
-- owner B = owner of another company.
\set viewer '''a0000000-0000-0000-0000-000000000002'''
\set clerk '''a0000000-0000-0000-0000-000000000003'''
\set accountant '''a0000000-0000-0000-0000-000000000004'''
\set ownerb '''b0000000-0000-0000-0000-000000000001'''
\set co '''c0000000-0000-0000-0000-00000000000a'''

-- Fixtures written as superuser.
insert into public.challans (id, company_id, customer_id, challan_number, date, grand_total)
values ('f0000000-0000-0000-0000-000000000001', :co, 'd0000000-0000-0000-0000-00000000000a', 'INV-RLS', '2026-10-01', 100);
insert into public.suppliers (id, company_id, name) values ('f0000000-0000-0000-0000-000000000002', :co, 'Supplier RLS');

-- ── Viewer: reads everything, writes nothing ─────────────────────────────────
select tests.as_user(:viewer);
select tests.eq((select count(*)::int from customers where company_id = :co), 1, 'viewer reads customers');
select tests.eq((select count(*)::int from challans where company_id = :co), 1, 'viewer reads invoices');
select tests.eq((select count(*)::int from stocks where company_id = :co), 2, 'viewer reads stock');

select tests.raises($$ insert into customers (company_id, name) values ('c0000000-0000-0000-0000-00000000000a', 'X') $$, 'row-level security', 'viewer cannot create customer');
select tests.raises($$ insert into stocks (company_id, quality_name) values ('c0000000-0000-0000-0000-00000000000a', 'X') $$, 'row-level security', 'viewer cannot create stock');
select tests.raises($$ insert into suppliers (company_id, name) values ('c0000000-0000-0000-0000-00000000000a', 'X') $$, 'row-level security', 'viewer cannot create supplier');
select tests.raises($$ select public.save_invoice(null, jsonb_build_object('company_id','c0000000-0000-0000-0000-00000000000a','customer_id','d0000000-0000-0000-0000-00000000000a','challan_number','V-1','date','2026-10-01'), '[]'::jsonb) $$, 'row-level security', 'viewer cannot create invoice via RPC');
select tests.raises($$ select public.record_invoice_payment('f0000000-0000-0000-0000-000000000001', 10, '2026-10-02') $$, 'do not have permission to record payments', 'viewer cannot record a payment');
select tests.raises($$ select public.save_delivery_challan(null, jsonb_build_object('company_id','c0000000-0000-0000-0000-00000000000a','customer_id','d0000000-0000-0000-0000-00000000000a','challan_number','V-DC','stock_id','e0000000-0000-0000-0000-00000000000a'), '[{"taka_no":"1"}]'::jsonb) $$, 'row-level security', 'viewer cannot create delivery challan');
select tests.raises($$ select public.save_purchase(jsonb_build_object('company_id','c0000000-0000-0000-0000-00000000000a','supplier_name','S','invoice_number','V-P','invoice_date','2026-10-01','financial_year','2026-27'), '[]'::jsonb, null) $$, 'row-level security', 'viewer cannot create purchase');
select tests.raises($$ select public.update_stock_details('e0000000-0000-0000-0000-00000000000a', 'Renamed', 20) $$, 'do not have permission to edit this stock', 'viewer cannot edit stock');

-- UPDATE / DELETE silently match no rows under RLS; prove nothing changed.
update challans set grand_total = 1 where id = 'f0000000-0000-0000-0000-000000000001';
delete from customers where company_id = :co;
delete from suppliers where id = 'f0000000-0000-0000-0000-000000000002';
select tests.as_superuser();
select tests.eq((select grand_total from challans where id = 'f0000000-0000-0000-0000-000000000001'), 100::numeric, 'viewer update of invoice had no effect');
select tests.eq((select count(*)::int from customers where company_id = :co), 1, 'viewer delete of customers had no effect');
select tests.eq((select count(*)::int from suppliers where id = 'f0000000-0000-0000-0000-000000000002'), 1, 'viewer delete of supplier had no effect');

-- ── Clerk (create/edit/delete granted): full workflow works ──────────────────
select tests.as_user(:clerk);
insert into customers (company_id, name) values (:co, 'Clerk Customer');
select tests.eq((select count(*)::int from customers where name = 'Clerk Customer'), 1, 'clerk creates customer');
select public.record_invoice_payment('f0000000-0000-0000-0000-000000000001', 40, '2026-10-02');
select tests.eq((select payment_amount_received from challans where id = 'f0000000-0000-0000-0000-000000000001'), 40::numeric, 'clerk records payment');
create temp table t_dc (id uuid) on commit drop;
insert into t_dc select public.save_delivery_challan(null, jsonb_build_object('company_id', :co, 'customer_id','d0000000-0000-0000-0000-00000000000a','challan_number','C-DC','stock_id','e0000000-0000-0000-0000-00000000000a'), '[{"taka_no":"1"}]'::jsonb);
select public.delete_delivery_challan((select id from t_dc));
select tests.eq((select sold_taka from stocks where id = 'e0000000-0000-0000-0000-00000000000a'), 0::numeric, 'clerk creates and deletes a challan, stock restored');
select public.update_stock_details('e0000000-0000-0000-0000-00000000000a', 'Quality A1', 22);
select tests.eq((select total_taka from stocks where id = 'e0000000-0000-0000-0000-00000000000a'), 22::numeric, 'clerk edits stock total');
delete from suppliers where id = 'f0000000-0000-0000-0000-000000000002';
select tests.eq((select count(*)::int from suppliers where id = 'f0000000-0000-0000-0000-000000000002'), 0, 'clerk deletes supplier');

-- ── Legacy Accountant without a matrix keeps access (K-1 default) ────────────
select tests.as_user(:accountant);
insert into customers (company_id, name) values (:co, 'Accountant Customer');
select tests.eq((select count(*)::int from customers where name = 'Accountant Customer'), 1, 'legacy accountant still writes');

-- ── Other company's owner: no reads, no writes ───────────────────────────────
select tests.as_user(:ownerb);
select tests.eq((select count(*)::int from challans where company_id = :co), 0, 'other company cannot read invoices');
select tests.raises($$ insert into customers (company_id, name) values ('c0000000-0000-0000-0000-00000000000a', 'Intruder') $$, 'row-level security', 'other company cannot write customers');

-- ── Anonymous: nothing ───────────────────────────────────────────────────────
select tests.as_anon();
select tests.eq((select count(*)::int from challans), 0, 'anon reads no invoices');
