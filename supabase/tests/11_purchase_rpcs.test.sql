-- DATA-001: purchase bills save and delete atomically, payment counted once.
\set owner '''a0000000-0000-0000-0000-000000000001'''
select tests.as_user(:owner);
create temp table t_ids (k text primary key, id uuid) on commit drop;

insert into t_ids values ('p1', public.save_purchase(
  jsonb_build_object('company_id','c0000000-0000-0000-0000-00000000000a','supplier_name','Supplier A','invoice_number','PB-1',
    'invoice_date','2026-10-01','financial_year','2026-27','purchase_type','Stock Purchase','status','Active',
    'subtotal',1000,'grand_total',1050),
  '[{"item_name":"Fabric","stock_id":"e0000000-0000-0000-0000-00000000000a","quantity":5,"total_amount":1050}]'::jsonb,
  '{"amount":400,"payment_method":"UPI"}'::jsonb));

select tests.eq((select paid_amount from purchases where id=(select id from t_ids where k='p1')), 400::numeric, 'initial payment counted once');
select tests.eq((select balance_amount from purchases where id=(select id from t_ids where k='p1')), 650::numeric, 'balance = total - paid');
select tests.eq((select payment_status from purchases where id=(select id from t_ids where k='p1')), 'Partially Paid', 'status Partially Paid');
select tests.eq((select count(*)::int from purchase_payments where purchase_id=(select id from t_ids where k='p1')), 1, 'one ledger row');
select tests.eq((select total_taka from stocks where id='e0000000-0000-0000-0000-00000000000a'), 25::numeric, 'stock purchase adds 5 taka');

select tests.raises($$ select public.save_purchase(
  jsonb_build_object('company_id','c0000000-0000-0000-0000-00000000000a','supplier_name','S','invoice_number','PB-OVER',
    'invoice_date','2026-10-01','financial_year','2026-27','grand_total',100),
  '[{"item_name":"x"}]'::jsonb, '{"amount":500}'::jsonb) $$, 'between 0 and the bill total', 'overpayment rejected');

select tests.raises($$ select public.save_purchase(
  jsonb_build_object('company_id','c0000000-0000-0000-0000-00000000000a','supplier_name','S','invoice_number','PB-BADSTOCK',
    'invoice_date','2026-10-01','financial_year','2026-27','purchase_type','Stock Purchase','grand_total',100),
  '[{"item_name":"x","stock_id":"e0000000-0000-0000-0000-0000000000ff","quantity":1}]'::jsonb, null) $$, 'foreign key', 'unknown stock rejected');
select tests.eq((select count(*)::int from purchases where invoice_number='PB-BADSTOCK'), 0, 'no bill saved when stock update fails');

insert into t_ids values ('draft', public.save_purchase(
  jsonb_build_object('company_id','c0000000-0000-0000-0000-00000000000a','supplier_name','S','invoice_number','PB-DRAFT',
    'invoice_date','2026-10-01','financial_year','2026-27','purchase_type','Stock Purchase','status','Draft','grand_total',10),
  '[{"item_name":"x","stock_id":"e0000000-0000-0000-0000-00000000000a","quantity":3}]'::jsonb, null));
select tests.eq((select total_taka from stocks where id='e0000000-0000-0000-0000-00000000000a'), 25::numeric, 'draft adds no stock');
select public.delete_purchase((select id from t_ids where k='draft'));
select tests.eq((select total_taka from stocks where id='e0000000-0000-0000-0000-00000000000a'), 25::numeric, 'deleting a draft removes no stock');

select public.delete_purchase((select id from t_ids where k='p1'));
select tests.eq((select total_taka from stocks where id='e0000000-0000-0000-0000-00000000000a'), 20::numeric, 'delete reverses stock');
select tests.eq((select count(*)::int from purchases where id=(select id from t_ids where k='p1')), 0, 'bill deleted');
