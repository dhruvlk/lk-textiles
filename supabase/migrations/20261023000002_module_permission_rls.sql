-- ════════════════════════════════════════════════════════════════════════════
-- SEC-001: enforce the employee permission matrix in the database.
--
-- Until now these tables allowed ANY active member to insert, update and delete
-- (`for all using (user_belongs_to_company(company_id))`), so the matrix shown in
-- Employees only hid buttons. Writes now require the module permission:
--   insert → create · update → edit · delete → delete
-- Line items follow their document (create or edit on the parent's module).
-- Recording a payment counts as editing the invoice / bill.
--
-- Reads are unchanged (any active member): dashboards, reports, the year-end
-- report and forms read across modules.
--
-- user_has_module_permission() returns true for Owners, and for legacy
-- Admin / Manager / Accountant members that have no matrix rows (decision K-1:
-- kept as today). Staff without a matrix row for a module get no writes.
-- The SECURITY INVOKER document RPCs (20261023000001) are covered by these
-- policies; the SECURITY DEFINER stock helpers are gated at the end of this file.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Tables owned directly by a company, one module each ─────────────────────
do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('customers',          'Members can access customers',          'customers'),
      ('products',           'Members can access products',           'products'),
      ('challans',           'Members can access challans',           'invoices'),
      ('delivery_challans',  'Members can access delivery challans',  'delivery_challans'),
      ('stocks',             'Members can access stocks',             'stock'),
      ('purchases',          'Members can access purchases',          'purchases'),
      ('suppliers',          'Members can access suppliers',          'purchases'),
      ('expenses',           'Members can access expenses',           'purchases'),
      ('letter_pads',        'Members can access letter pads',        'letter_pads')
    ) as v(tbl, old_policy, module)
  loop
    execute format('drop policy if exists %I on public.%I', t.old_policy, t.tbl);
    execute format('drop policy if exists %I on public.%I', t.tbl || ': members read', t.tbl);
    execute format('drop policy if exists %I on public.%I', t.tbl || ': create', t.tbl);
    execute format('drop policy if exists %I on public.%I', t.tbl || ': edit', t.tbl);
    execute format('drop policy if exists %I on public.%I', t.tbl || ': delete', t.tbl);

    execute format(
      'create policy %I on public.%I for select using (public.user_belongs_to_company(company_id))',
      t.tbl || ': members read', t.tbl);
    execute format(
      'create policy %I on public.%I for insert with check (public.user_has_module_permission(company_id, %L, ''create''))',
      t.tbl || ': create', t.tbl, t.module);
    execute format(
      'create policy %I on public.%I for update using (public.user_has_module_permission(company_id, %L, ''edit'')) with check (public.user_has_module_permission(company_id, %L, ''edit''))',
      t.tbl || ': edit', t.tbl, t.module, t.module);
    execute format(
      'create policy %I on public.%I for delete using (public.user_has_module_permission(company_id, %L, ''delete''))',
      t.tbl || ': delete', t.tbl, t.module);
  end loop;
end;
$$;

-- ─── Line items: follow the parent document ─────────────────────────────────
drop policy if exists "Members can access challan items" on public.challan_items;
create policy "challan_items: members read" on public.challan_items for select
  using (exists (select 1 from public.challans c
                 where c.id = challan_items.challan_id and public.user_belongs_to_company(c.company_id)));
-- Lines are added when a invoice is created or edited; changing or removing
-- existing lines is an edit.
create policy "challan_items: add lines" on public.challan_items for insert
  with check (exists (select 1 from public.challans c
                 where c.id = challan_items.challan_id
                   and (public.user_has_module_permission(c.company_id, 'invoices', 'create')
                        or public.user_has_module_permission(c.company_id, 'invoices', 'edit'))));
create policy "challan_items: change lines" on public.challan_items for update
  using (exists (select 1 from public.challans c
                 where c.id = challan_items.challan_id and public.user_has_module_permission(c.company_id, 'invoices', 'edit')))
  with check (exists (select 1 from public.challans c
                 where c.id = challan_items.challan_id and public.user_has_module_permission(c.company_id, 'invoices', 'edit')));
create policy "challan_items: remove lines" on public.challan_items for delete
  using (exists (select 1 from public.challans c
                 where c.id = challan_items.challan_id and public.user_has_module_permission(c.company_id, 'invoices', 'edit')));

drop policy if exists "Members can access delivery challan items" on public.delivery_challan_items;
create policy "delivery_challan_items: members read" on public.delivery_challan_items for select
  using (exists (select 1 from public.delivery_challans dc
                 where dc.id = delivery_challan_items.delivery_challan_id and public.user_belongs_to_company(dc.company_id)));
-- Lines are added when a delivery challan is created or edited; changing or removing
-- existing lines is an edit.
create policy "delivery_challan_items: add lines" on public.delivery_challan_items for insert
  with check (exists (select 1 from public.delivery_challans dc
                 where dc.id = delivery_challan_items.delivery_challan_id
                   and (public.user_has_module_permission(dc.company_id, 'delivery_challans', 'create')
                        or public.user_has_module_permission(dc.company_id, 'delivery_challans', 'edit'))));
create policy "delivery_challan_items: change lines" on public.delivery_challan_items for update
  using (exists (select 1 from public.delivery_challans dc
                 where dc.id = delivery_challan_items.delivery_challan_id and public.user_has_module_permission(dc.company_id, 'delivery_challans', 'edit')))
  with check (exists (select 1 from public.delivery_challans dc
                 where dc.id = delivery_challan_items.delivery_challan_id and public.user_has_module_permission(dc.company_id, 'delivery_challans', 'edit')));
create policy "delivery_challan_items: remove lines" on public.delivery_challan_items for delete
  using (exists (select 1 from public.delivery_challans dc
                 where dc.id = delivery_challan_items.delivery_challan_id and public.user_has_module_permission(dc.company_id, 'delivery_challans', 'edit')));

drop policy if exists "Members can access purchase items" on public.purchase_items;
create policy "purchase_items: members read" on public.purchase_items for select
  using (exists (select 1 from public.purchases p
                 where p.id = purchase_items.purchase_id and public.user_belongs_to_company(p.company_id)));
-- Lines are added when a bill is created or edited; changing or removing
-- existing lines is an edit.
create policy "purchase_items: add lines" on public.purchase_items for insert
  with check (exists (select 1 from public.purchases p
                 where p.id = purchase_items.purchase_id
                   and (public.user_has_module_permission(p.company_id, 'purchases', 'create')
                        or public.user_has_module_permission(p.company_id, 'purchases', 'edit'))));
create policy "purchase_items: change lines" on public.purchase_items for update
  using (exists (select 1 from public.purchases p
                 where p.id = purchase_items.purchase_id and public.user_has_module_permission(p.company_id, 'purchases', 'edit')))
  with check (exists (select 1 from public.purchases p
                 where p.id = purchase_items.purchase_id and public.user_has_module_permission(p.company_id, 'purchases', 'edit')));
create policy "purchase_items: remove lines" on public.purchase_items for delete
  using (exists (select 1 from public.purchases p
                 where p.id = purchase_items.purchase_id and public.user_has_module_permission(p.company_id, 'purchases', 'edit')));

-- ─── Payments: recording one = editing the document ──────────────────────────
drop policy if exists "Members can access challan payments" on public.challan_payments;
create policy "challan_payments: members read" on public.challan_payments for select
  using (public.user_belongs_to_company(company_id));
create policy "challan_payments: write with invoice edit" on public.challan_payments for all
  using (public.user_has_module_permission(company_id, 'invoices', 'edit'))
  with check (public.user_has_module_permission(company_id, 'invoices', 'edit'));

-- A bill's initial payment is written while creating it, so create also counts
-- for adding a payment; changing or removing one is an edit.
drop policy if exists "Members can access purchase payments" on public.purchase_payments;
create policy "purchase_payments: members read" on public.purchase_payments for select
  using (public.user_belongs_to_company(company_id));
create policy "purchase_payments: add" on public.purchase_payments for insert
  with check (public.user_has_module_permission(company_id, 'purchases', 'create')
              or public.user_has_module_permission(company_id, 'purchases', 'edit'));
create policy "purchase_payments: change" on public.purchase_payments for update
  using (public.user_has_module_permission(company_id, 'purchases', 'edit'))
  with check (public.user_has_module_permission(company_id, 'purchases', 'edit'));
create policy "purchase_payments: remove" on public.purchase_payments for delete
  using (public.user_has_module_permission(company_id, 'purchases', 'edit'));

-- ─── Stock history and vault documents ───────────────────────────────────────
-- Delivery challan and purchase movements are written by SECURITY DEFINER
-- helpers; direct writes come from the Stock screen (opening stock, total edits).
drop policy if exists "Members can access stock movements" on public.stock_movements;
create policy "stock_movements: members read" on public.stock_movements for select
  using (public.user_belongs_to_company(company_id));
create policy "stock_movements: write with stock" on public.stock_movements for insert
  with check (public.user_has_module_permission(company_id, 'stock', 'create')
              or public.user_has_module_permission(company_id, 'stock', 'edit'));
create policy "stock_movements: delete with stock delete" on public.stock_movements for delete
  using (public.user_has_module_permission(company_id, 'stock', 'delete'));

drop policy if exists "Members can access documents" on public.documents;
create policy "documents: members read" on public.documents for select
  using (public.user_belongs_to_company(company_id));
create policy "documents: attach" on public.documents for insert
  with check (public.user_has_module_permission(company_id, 'purchases', 'create')
              or public.user_has_module_permission(company_id, 'purchases', 'edit'));
create policy "documents: edit" on public.documents for update
  using (public.user_has_module_permission(company_id, 'purchases', 'edit'))
  with check (public.user_has_module_permission(company_id, 'purchases', 'edit'));
create policy "documents: remove" on public.documents for delete
  using (public.user_has_module_permission(company_id, 'purchases', 'edit')
         or public.user_has_module_permission(company_id, 'purchases', 'delete'));

-- Default categories are seeded automatically the first time any member opens
-- Purchases, so members may insert those system rows; custom ones need create.
drop policy if exists "Members can access expense categories" on public.expense_categories;
create policy "expense_categories: members read" on public.expense_categories for select
  using (public.user_belongs_to_company(company_id));
create policy "expense_categories: create" on public.expense_categories for insert
  with check (public.user_has_module_permission(company_id, 'purchases', 'create')
              or (is_system = true
                  and public.user_belongs_to_company(company_id)
                  -- the defaults in constants (DEFAULT_EXPENSE_CATEGORIES)
                  and name = any (array[
                   'Raw Material',
                   'Yarn',
                   'Fabric',
                   'Dye & Chemical',
                   'Packing Material',
                   'Transport & Freight',
                   'Machine Spare Parts',
                   'Machine Maintenance & Repair',
                   'Electricity & Power',
                   'Factory / Office Rent',
                   'Telephone & Internet',
                   'Office Supplies & Stationery',
                   'Printing & Xerox',
                   'Salary & Wages Related',
                   'Travel & Conveyance',
                   'Fuel & Petrol',
                   'Professional & CA Fees',
                   'Bank Charges & Interest',
                   'Insurance',
                   'Advertisement & Marketing',
                   'Other Expenses'
                  ])));
create policy "expense_categories: edit" on public.expense_categories for update
  using (public.user_has_module_permission(company_id, 'purchases', 'edit'))
  with check (public.user_has_module_permission(company_id, 'purchases', 'edit'));
create policy "expense_categories: delete" on public.expense_categories for delete
  using (public.user_has_module_permission(company_id, 'purchases', 'delete'));

-- ─── Remaining member-wide write paths ───────────────────────────────────────
-- Closing / reopening a financial year belongs to the purchases & year-end module.
drop policy if exists "Members can access financial years" on public.financial_years;
create policy "financial_years: members read" on public.financial_years for select
  using (public.user_belongs_to_company(company_id));
create policy "financial_years: create" on public.financial_years for insert
  with check (public.user_has_module_permission(company_id, 'purchases', 'create')
              or public.user_has_module_permission(company_id, 'purchases', 'edit'));
create policy "financial_years: edit" on public.financial_years for update
  using (public.user_has_module_permission(company_id, 'purchases', 'edit'))
  with check (public.user_has_module_permission(company_id, 'purchases', 'edit'));
create policy "financial_years: delete" on public.financial_years for delete
  using (public.user_has_module_permission(company_id, 'purchases', 'delete'));

-- Legacy product stock ledger (Products module is switched off).
drop policy if exists "Members can access stock transactions" on public.stock_transactions;
create policy "stock_transactions: members read" on public.stock_transactions for select
  using (public.user_belongs_to_company(company_id));
create policy "stock_transactions: write with stock edit" on public.stock_transactions for all
  using (public.user_has_module_permission(company_id, 'stock', 'edit'))
  with check (public.user_has_module_permission(company_id, 'stock', 'edit'));

-- Vault files: uploading needs purchases create or edit, deleting needs edit or delete.
-- (Reads stay member-wide; files are served through short-lived signed URLs.)
drop policy if exists "Members can upload company documents" on storage.objects;
create policy "Members can upload company documents"
  on storage.objects for insert
  with check (
    bucket_id = 'company-documents'
    and (
      public.user_has_module_permission(((storage.foldername(name))[1])::uuid, 'purchases', 'create')
      or public.user_has_module_permission(((storage.foldername(name))[1])::uuid, 'purchases', 'edit')
    )
  );
drop policy if exists "Members can delete company documents" on storage.objects;
create policy "Members can delete company documents"
  on storage.objects for delete
  using (
    bucket_id = 'company-documents'
    and (
      public.user_has_module_permission(((storage.foldername(name))[1])::uuid, 'purchases', 'edit')
      or public.user_has_module_permission(((storage.foldername(name))[1])::uuid, 'purchases', 'delete')
    )
  );

-- ─── Stock helpers: no direct calls from the API ─────────────────────────────
-- process_quality_stock_change / process_purchase_stock_change are SECURITY
-- DEFINER and only checked company membership, so any member could change stock
-- by calling them directly. The originals move to the `private` schema, which
-- signed-in users cannot use at all; same-name SECURITY DEFINER gates in
-- `public` (auth.uid() still identifies the caller) allow a call only from inside
-- the document functions (see _allow_document_stock_change in 20261023000001),
-- from users with Stock → Edit, or from the service role.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

alter function public.process_quality_stock_change(uuid, uuid, numeric, text, text, uuid, uuid, uuid, text, uuid)
  set schema private;
alter function public.process_purchase_stock_change(uuid, uuid, numeric, text, uuid, text, uuid)
  set schema private;
revoke execute on function private.process_quality_stock_change(uuid, uuid, numeric, text, text, uuid, uuid, uuid, text, uuid) from public, anon;
revoke execute on function private.process_purchase_stock_change(uuid, uuid, numeric, text, uuid, text, uuid) from public, anon;
revoke execute on function private.process_quality_stock_change(uuid, uuid, numeric, text, text, uuid, uuid, uuid, text, uuid) from authenticated;
revoke execute on function private.process_purchase_stock_change(uuid, uuid, numeric, text, uuid, text, uuid) from authenticated;
grant execute on function private.process_quality_stock_change(uuid, uuid, numeric, text, text, uuid, uuid, uuid, text, uuid) to service_role;
grant execute on function private.process_purchase_stock_change(uuid, uuid, numeric, text, uuid, text, uuid) to service_role;

create or replace function public.stock_change_allowed(p_company_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(current_setting('app.document_stock_change', true), '') = 'on'
      or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
      or public.user_has_module_permission(p_company_id, 'stock', 'edit');
$$;

create or replace function public.process_quality_stock_change(
  p_company_id uuid,
  p_stock_id uuid,
  p_delta numeric,
  p_transaction_type text,
  p_reference_type text default null,
  p_reference_id uuid default null,
  p_challan_id uuid default null,
  p_delivery_challan_id uuid default null,
  p_notes text default null,
  p_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.stock_change_allowed(p_company_id) then
    raise exception 'Not allowed to change stock directly';
  end if;
  perform private.process_quality_stock_change(
    p_company_id, p_stock_id, p_delta, p_transaction_type, p_reference_type,
    p_reference_id, p_challan_id, p_delivery_challan_id, p_notes, p_user_id
  );
end;
$$;

create or replace function public.process_purchase_stock_change(
  p_company_id uuid,
  p_stock_id uuid,
  p_quantity numeric,
  p_transaction_type text,
  p_purchase_id uuid default null,
  p_notes text default null,
  p_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.stock_change_allowed(p_company_id) then
    raise exception 'Not allowed to change stock directly';
  end if;
  perform private.process_purchase_stock_change(
    p_company_id, p_stock_id, p_quantity, p_transaction_type, p_purchase_id, p_notes, p_user_id
  );
end;
$$;

-- Legacy product-stock helpers are unused by the app: service role only.
revoke execute on function public.record_stock_movement(uuid, uuid, text, numeric, uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.process_challan_stock_update(uuid, uuid, jsonb, uuid) from public, anon, authenticated;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.stock_change_allowed(uuid)',
    'public.process_quality_stock_change(uuid, uuid, numeric, text, text, uuid, uuid, uuid, text, uuid)',
    'public.process_purchase_stock_change(uuid, uuid, numeric, text, uuid, text, uuid)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated, service_role', fn);
  end loop;
end;
$$;
