-- DATA-001: invoices, payments, delivery challans and stock save atomically.
\set owner '''a0000000-0000-0000-0000-000000000001'''
\set co '''c0000000-0000-0000-0000-00000000000a'''

select tests.as_user(:owner);

-- ── Invoice create: header + items in one call ───────────────────────────────
create temp table t_ids (k text primary key, id uuid) on commit drop;
insert into t_ids values ('inv', public.save_invoice(null,
  jsonb_build_object('company_id', :co, 'customer_id', 'd0000000-0000-0000-0000-00000000000a',
    'challan_number', 'INV-1', 'date', '2026-10-01', 'status', 'Pending',
    'subtotal', 1000, 'cgst_percent', 2.5, 'sgst_percent', 2.5, 'cgst_amount', 25, 'sgst_amount', 25,
    'grand_total', 1050, 'due_date', '2999-01-01'),
  '[{"quality":"Q1","quantity_display":"500 Mts","meter":500,"rate":1,"amount":500},
    {"quality":"Q2","quantity_display":"500 Mts","meter":500,"rate":1,"amount":500}]'::jsonb));

select tests.eq((select count(*)::int from challan_items where challan_id = (select id from t_ids where k='inv')), 2, 'invoice created with 2 items');
select tests.eq((select payment_status from challans where id = (select id from t_ids where k='inv')), 'Pending', 'new invoice is Pending');

-- ── A failing item leaves NO invoice behind (atomic) ────────────────────────
select tests.raises($$ select public.save_invoice(null,
  jsonb_build_object('company_id','c0000000-0000-0000-0000-00000000000a','customer_id','d0000000-0000-0000-0000-00000000000a',
    'challan_number','INV-BAD','date','2026-10-01','grand_total',10),
  '[{"amount":"not-a-number"}]'::jsonb) $$, 'invalid input syntax', 'bad item raises');
select tests.eq((select count(*)::int from challans where challan_number = 'INV-BAD'), 0, 'no orphan header after failed item insert');

-- ── Payments: running total, ledger, overpayment guard ───────────────────────
select public.record_invoice_payment((select id from t_ids where k='inv'), 300, '2026-10-05', 'UPI', 'R1', null);
select public.record_invoice_payment((select id from t_ids where k='inv'), 200, '2026-10-06', 'Cash', null, null);
select tests.eq((select payment_amount_received from challans where id = (select id from t_ids where k='inv')), 500::numeric, 'two payments summed');
select tests.eq((select count(*)::int from challan_payments where challan_id = (select id from t_ids where k='inv')), 2, 'two ledger rows');
select tests.eq((select payment_status from challans where id = (select id from t_ids where k='inv')), 'Partially Paid', 'status Partially Paid');
select tests.raises(format($$ select public.record_invoice_payment(%L, 600, '2026-10-07') $$, (select id from t_ids where k='inv')),
  'exceeds remaining balance of ₹550.00', 'overpayment rejected');
select tests.eq((select count(*)::int from challan_payments where challan_id = (select id from t_ids where k='inv')), 2, 'rejected payment wrote no ledger row');

-- ── Invoice update keeps payments and replaces items ─────────────────────────
select public.save_invoice((select id from t_ids where k='inv'),
  jsonb_build_object('company_id', :co, 'customer_id', 'd0000000-0000-0000-0000-00000000000a',
    'challan_number', 'INV-1', 'date', '2026-10-01', 'status', 'Pending', 'subtotal', 500, 'grand_total', 500, 'due_date', '2999-01-01'),
  '[{"quality":"Q1","amount":500}]'::jsonb);
select tests.eq((select count(*)::int from challan_items where challan_id = (select id from t_ids where k='inv')), 1, 'items replaced on update');
select tests.eq((select payment_amount_received from challans where id = (select id from t_ids where k='inv')), 500::numeric, 'received preserved on update');
select tests.eq((select payment_status from challans where id = (select id from t_ids where k='inv')), 'Paid', 'status recomputed to Paid');

-- ── Overdue derives from due date in IST ─────────────────────────────────────
select tests.eq(public.resolve_invoice_payment_status(100, 0, '2000-01-01'), 'Overdue', 'past due unpaid is Overdue');
select tests.eq(public.resolve_invoice_payment_status(100, 100, '2000-01-01'), 'Paid', 'paid beats overdue');

-- ── Delivery challan: blank rows ignored, stock charged ──────────────────────
insert into t_ids values ('dc', public.save_delivery_challan(null,
  jsonb_build_object('company_id', :co, 'customer_id', 'd0000000-0000-0000-0000-00000000000a',
    'challan_number', 'DC-1', 'date', '2026-10-02', 'stock_id', 'e0000000-0000-0000-0000-00000000000a', 'status', 'Pending'),
  '[{"taka_no":"1","meters":100,"weight":20},{"taka_no":"2","meters":101.5,"weight":21},{"taka_no":"","meters":0,"weight":0}]'::jsonb));
select tests.eq((select total_pieces from delivery_challans where id = (select id from t_ids where k='dc')), 2::numeric, 'blank taka row not counted');
select tests.eq((select total_meters from delivery_challans where id = (select id from t_ids where k='dc')), 201.5::numeric, 'meters summed');
select tests.eq((select sold_taka from stocks where id = 'e0000000-0000-0000-0000-00000000000a'), 2::numeric, 'stock charged 2 taka');

-- ── Over-stock challan rolls back completely ─────────────────────────────────
select tests.raises($$ select public.save_delivery_challan(null,
  jsonb_build_object('company_id','c0000000-0000-0000-0000-00000000000a','customer_id','d0000000-0000-0000-0000-00000000000a',
    'challan_number','DC-BIG','stock_id','e0000000-0000-0000-0000-00000000000c'),
  (select jsonb_agg(jsonb_build_object('taka_no', g::text, 'meters', 100)) from generate_series(1, 11) g)) $$,
  'Only 10.00 Taka Available', 'over-stock rejected');
select tests.eq((select count(*)::int from delivery_challans where challan_number = 'DC-BIG'), 0, 'no challan saved when stock fails');
select tests.eq((select sold_taka from stocks where id = 'e0000000-0000-0000-0000-00000000000c'), 0::numeric, 'stock untouched when challan fails');

-- ── Edit moving to another quality releases old stock, charges new ───────────
select public.save_delivery_challan((select id from t_ids where k='dc'),
  jsonb_build_object('company_id', :co, 'customer_id', 'd0000000-0000-0000-0000-00000000000a',
    'challan_number', 'DC-1', 'stock_id', 'e0000000-0000-0000-0000-00000000000c', 'status', 'Pending'),
  '[{"taka_no":"1","meters":100},{"taka_no":"2","meters":100},{"taka_no":"3","meters":100}]'::jsonb);
select tests.eq((select sold_taka from stocks where id = 'e0000000-0000-0000-0000-00000000000a'), 0::numeric, 'old quality released');
select tests.eq((select sold_taka from stocks where id = 'e0000000-0000-0000-0000-00000000000c'), 3::numeric, 'new quality charged 3');

-- ── Delete restores stock ────────────────────────────────────────────────────
select public.delete_delivery_challan((select id from t_ids where k='dc'));
select tests.eq((select sold_taka from stocks where id = 'e0000000-0000-0000-0000-00000000000c'), 0::numeric, 'delete restores stock');
select tests.eq((select available_taka from stocks where id = 'e0000000-0000-0000-0000-00000000000c'), 10::numeric, 'available back to 10');

-- ── Stock total edit under lock ──────────────────────────────────────────────
select public.save_delivery_challan(null,
  jsonb_build_object('company_id', :co, 'customer_id', 'd0000000-0000-0000-0000-00000000000a',
    'challan_number', 'DC-2', 'stock_id', 'e0000000-0000-0000-0000-00000000000a'),
  '[{"taka_no":"1","meters":1},{"taka_no":"2","meters":1},{"taka_no":"3","meters":1},{"taka_no":"4","meters":1}]'::jsonb);
select tests.raises($$ select public.update_stock_details('e0000000-0000-0000-0000-00000000000a', 'Quality A1', 3) $$,
  'cannot be less than Sold Taka (4)', 'total below sold rejected');
select public.update_stock_details('e0000000-0000-0000-0000-00000000000a', 'Quality A1', 30, '5407', null);
select tests.eq((select available_taka from stocks where id = 'e0000000-0000-0000-0000-00000000000a'), 26::numeric, 'available = total - sold');
select tests.eq((select sold_taka from stocks where id = 'e0000000-0000-0000-0000-00000000000a'), 4::numeric, 'sold untouched by total edit');

-- ── Cross-company and anonymous access blocked ───────────────────────────────
select tests.raises($$ select public.save_delivery_challan(null,
  jsonb_build_object('company_id','c0000000-0000-0000-0000-00000000000b','customer_id','d0000000-0000-0000-0000-00000000000b',
    'challan_number','DC-X','stock_id','e0000000-0000-0000-0000-00000000000b'), '[{"taka_no":"1"}]'::jsonb) $$,
  'row-level security', 'cannot write into another company');
select tests.as_anon();
select tests.raises($$ select public.record_invoice_payment('00000000-0000-0000-0000-000000000000', 1, null) $$,
  'permission denied', 'anon cannot call payment RPC');
