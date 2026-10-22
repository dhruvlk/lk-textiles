-- Regression tests for issues found in the Phase 1 review.
\set viewer '''a0000000-0000-0000-0000-000000000002'''
\set creator '''a0000000-0000-0000-0000-000000000005'''
\set owner '''a0000000-0000-0000-0000-000000000001'''
\set co '''c0000000-0000-0000-0000-00000000000a'''

-- Fixtures (superuser): an invoice with items and a bill with a payment.
insert into challans (id, company_id, customer_id, challan_number, date, grand_total, due_date)
values ('f1000000-0000-0000-0000-000000000001', :co, 'd0000000-0000-0000-0000-00000000000a', 'INV-REV', '2026-10-01', 100, '2000-01-01');
insert into challan_items (challan_id, quality, amount) values ('f1000000-0000-0000-0000-000000000001', 'Q', 100);
insert into purchases (id, company_id, supplier_name, invoice_number, invoice_date, financial_year, grand_total, balance_amount)
values ('f1000000-0000-0000-0000-000000000002', :co, 'S', 'PB-REV', '2026-10-01', '2026-27', 1000, 1000);
insert into purchase_payments (company_id, purchase_id, amount) values (:co, 'f1000000-0000-0000-0000-000000000002', 1);

-- 1. Stock helpers can't be called directly without Stock → Edit.
select tests.as_user(:viewer);
select tests.raises($$ select public.process_quality_stock_change('c0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-00000000000a', 5, 'Sale') $$,
  'Not allowed to change stock directly', 'viewer cannot call quality stock helper');
select tests.raises($$ select public.process_purchase_stock_change('c0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-00000000000a', 100, 'Purchase') $$,
  'Not allowed to change stock directly', 'viewer cannot call purchase stock helper');
select tests.raises($$ select private.process_quality_stock_change('c0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-00000000000a', 5, 'Sale') $$,
  'permission denied', 'private helper not reachable as a bypass');

-- 2. Create-only rights don't allow removing lines or payments.
select tests.as_user(:creator);
delete from challan_items where challan_id = 'f1000000-0000-0000-0000-000000000001';
delete from purchase_payments where purchase_id = 'f1000000-0000-0000-0000-000000000002';
select tests.as_superuser();
select tests.eq((select count(*)::int from challan_items where challan_id = 'f1000000-0000-0000-0000-000000000001'), 1, 'create-only user cannot delete invoice lines');
select tests.eq((select count(*)::int from purchase_payments where purchase_id = 'f1000000-0000-0000-0000-000000000002'), 1, 'create-only user cannot delete purchase payments');

-- 2b. ...but can still create a complete invoice.
select tests.as_user(:creator);
create temp table t_inv (id uuid) on commit drop;
insert into t_inv select public.save_invoice(null,
  jsonb_build_object('company_id', :co, 'customer_id', 'd0000000-0000-0000-0000-00000000000a', 'challan_number', 'INV-CREATOR', 'date', '2026-10-01', 'grand_total', 5),
  '[{"amount":5}]'::jsonb);
select tests.eq((select count(*)::int from challan_items where challan_id = (select id from t_inv)), 1, 'create-only user creates an invoice with its lines');

-- 3. Purchase payments: atomic, and refused clearly without edit.
select tests.raises($$ select public.record_purchase_payment('f1000000-0000-0000-0000-000000000002', 100, 'UPI') $$,
  'do not have permission to record payments on this bill', 'create-only user cannot record a bill payment');
select tests.as_user(:owner);
select public.record_purchase_payment('f1000000-0000-0000-0000-000000000002', 499, 'UPI', '2026-10-05');
select tests.eq((select paid_amount from purchases where id = 'f1000000-0000-0000-0000-000000000002'), 499::numeric, 'bill paid amount updated with the ledger');
select tests.eq((select payment_status from purchases where id = 'f1000000-0000-0000-0000-000000000002'), 'Partially Paid', 'bill status updated');
select tests.raises($$ select public.record_purchase_payment('f1000000-0000-0000-0000-000000000002', 600, 'UPI') $$,
  'exceeds remaining balance of ₹501.00', 'bill overpayment rejected');

-- 5. Deleting a bill whose stock was delivered gives a readable reason.
create temp table t_pb (id uuid) on commit drop;
insert into t_pb select public.save_purchase(
  jsonb_build_object('company_id', :co, 'supplier_name','S','invoice_number','PB-DELIV','invoice_date','2026-10-01','financial_year','2026-27','purchase_type','Stock Purchase','grand_total',10),
  '[{"item_name":"x","stock_id":"e0000000-0000-0000-0000-00000000000c","quantity":5}]'::jsonb, null);
select public.save_delivery_challan(null, jsonb_build_object('company_id', :co, 'customer_id','d0000000-0000-0000-0000-00000000000a','challan_number','DC-ALL','stock_id','e0000000-0000-0000-0000-00000000000c'),
  (select jsonb_agg(jsonb_build_object('taka_no', g::text)) from generate_series(1, 12) g));
select tests.raises(format($$ select public.delete_purchase(%L) $$, (select id from t_pb)),
  'Cannot delete this bill: only 3 of its 5 Taka of Quality A2', 'delivered stock blocks bill delete with a reason');
select tests.eq((select count(*)::int from purchases where id = (select id from t_pb)), 1, 'bill kept when delete is blocked');

-- 7. An explicit null clears the due date.
select public.save_invoice('f1000000-0000-0000-0000-000000000001',
  jsonb_build_object('company_id', :co, 'customer_id', 'd0000000-0000-0000-0000-00000000000a', 'challan_number', 'INV-REV', 'date', '2026-10-01', 'grand_total', 100, 'due_date', null),
  '[{"amount":100}]'::jsonb);
select tests.eq((select due_date from challans where id = 'f1000000-0000-0000-0000-000000000001'), null::date, 'due date cleared');
select tests.eq((select payment_status from challans where id = 'f1000000-0000-0000-0000-000000000001'), 'Pending', 'no longer Overdue once the due date is cleared');

-- 8. Members may seed only the default system categories.
select tests.as_user(:viewer);
insert into expense_categories (company_id, name, is_system) values (:co, 'Yarn', true);
select tests.raises($$ insert into expense_categories (company_id, name, is_system) values ('c0000000-0000-0000-0000-00000000000a', 'Anything I like', true) $$,
  'row-level security', 'viewer cannot invent system categories');

-- Remaining member-wide writes are closed.
select tests.raises($$ insert into financial_years (company_id, year_label, start_date, end_date) values ('c0000000-0000-0000-0000-00000000000a', '2030-31', '2030-04-01', '2031-03-31') $$,
  'row-level security', 'viewer cannot create a financial year');
