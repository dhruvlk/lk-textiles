-- ════════════════════════════════════════════════════════════════════════════
-- DATA-001: transactional writes for invoices, invoice payments, delivery
-- challans (with stock), purchase bills (with stock and initial payment) and
-- stock totals.
--
-- Previously the browser wrote each of these in several separate requests
-- (header, items, payment ledger, totals, stock movements). A failure part-way
-- left partial data, and read-then-write payment totals lost updates when two
-- users recorded payments at once. Each function below runs in ONE transaction.
--
-- All functions are SECURITY INVOKER: they run with the caller's privileges,
-- so row level security (including per-module permissions) still applies.
-- Additive only; no existing table, column or function is changed.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Payment status (mirrors lib/payment-status.ts resolvePaymentStatus) ─────
create or replace function public.resolve_invoice_payment_status(
  p_total numeric,
  p_received numeric,
  p_due date
)
returns text
language sql
stable
set search_path = public
as $$
  select case
    when (coalesce(p_total, 0) <= 0 and coalesce(p_received, 0) > 0)
      or (coalesce(p_total, 0) > 0 and coalesce(p_received, 0) >= p_total - 0.01)
      then 'Paid'
    when p_due is not null and (now() at time zone 'Asia/Kolkata')::date > p_due
      then 'Overdue'
    when coalesce(p_received, 0) > 0.01
      then 'Partially Paid'
    else 'Pending'
  end;
$$;

-- ─── Internal: mark that stock is being changed by a document function ──────
-- The stock helpers (process_quality_stock_change, process_purchase_stock_change)
-- are gated in 20261023000002: they accept calls made from inside these document
-- functions, or from users with Stock → Edit. The flag is transaction-local and
-- cannot be set through the API (PostgREST only exposes functions in `public`).
create or replace function public._allow_document_stock_change()
returns void
language sql
volatile
set search_path = public
as $$
  select set_config('app.document_stock_change', 'on', true);
$$;

-- ─── Invoice header + items ──────────────────────────────────────────────────
-- p_invoice_id null → create; otherwise update that invoice (payment fields are
-- preserved and its payment status is recomputed from the new total).
create or replace function public.save_invoice(
  p_invoice_id uuid,
  p_header jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  v_company uuid := nullif(p_header->>'company_id', '')::uuid;
  v_existing public.challans%rowtype;
  v_total numeric := coalesce(nullif(p_header->>'grand_total', '')::numeric, 0);
  v_due date := nullif(p_header->>'due_date', '')::date;
begin
  if v_company is null then
    raise exception 'company_id is required';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'items must be a JSON array';
  end if;

  if p_invoice_id is null then
    insert into public.challans (
      company_id, customer_id, challan_number, date, bill_number, vehicle_number,
      delivered_by, driver_mobile, delivery_location, broker,
      payment_within_value, payment_within_unit, payment_terms, due_date,
      amount_in_words, notes, status, created_by,
      subtotal, discount, cgst_percent, sgst_percent, igst_percent,
      cgst_amount, sgst_amount, igst_amount, other_charges, grand_total,
      payment_status, payment_amount_received, payment_received_date,
      payment_reference, payment_notes, payment_mode
    ) values (
      v_company,
      (p_header->>'customer_id')::uuid,
      p_header->>'challan_number',
      (p_header->>'date')::date,
      nullif(p_header->>'bill_number', ''),
      nullif(p_header->>'vehicle_number', ''),
      nullif(p_header->>'delivered_by', ''),
      nullif(p_header->>'driver_mobile', ''),
      nullif(p_header->>'delivery_location', ''),
      nullif(p_header->>'broker', ''),
      nullif(p_header->>'payment_within_value', '')::integer,
      nullif(p_header->>'payment_within_unit', ''),
      nullif(p_header->>'payment_terms', ''),
      v_due,
      nullif(p_header->>'amount_in_words', ''),
      nullif(p_header->>'notes', ''),
      coalesce(nullif(p_header->>'status', ''), 'Draft'),
      coalesce(nullif(p_header->>'created_by', '')::uuid, auth.uid()),
      coalesce(nullif(p_header->>'subtotal', '')::numeric, 0),
      coalesce(nullif(p_header->>'discount', '')::numeric, 0),
      coalesce(nullif(p_header->>'cgst_percent', '')::numeric, 0),
      coalesce(nullif(p_header->>'sgst_percent', '')::numeric, 0),
      coalesce(nullif(p_header->>'igst_percent', '')::numeric, 0),
      coalesce(nullif(p_header->>'cgst_amount', '')::numeric, 0),
      coalesce(nullif(p_header->>'sgst_amount', '')::numeric, 0),
      coalesce(nullif(p_header->>'igst_amount', '')::numeric, 0),
      coalesce(nullif(p_header->>'other_charges', '')::numeric, 0),
      v_total,
      public.resolve_invoice_payment_status(v_total, 0, v_due),
      0, null, null, null, null
    )
    returning id into v_id;
  else
    select * into v_existing
    from public.challans
    where id = p_invoice_id
    for update;

    if not found then
      if exists (select 1 from public.challans where id = p_invoice_id) then
        raise exception 'You do not have permission to edit this invoice';
      end if;
      raise exception 'Invoice not found';
    end if;
    if v_existing.company_id <> v_company then
      raise exception 'Invoice belongs to a different company';
    end if;

    update public.challans set
      customer_id = (p_header->>'customer_id')::uuid,
      challan_number = p_header->>'challan_number',
      date = (p_header->>'date')::date,
      bill_number = nullif(p_header->>'bill_number', ''),
      delivered_by = nullif(p_header->>'delivered_by', ''),
      broker = nullif(p_header->>'broker', ''),
      payment_within_value = nullif(p_header->>'payment_within_value', '')::integer,
      payment_within_unit = nullif(p_header->>'payment_within_unit', ''),
      payment_terms = nullif(p_header->>'payment_terms', ''),
      -- An explicit null clears the due date; an absent key keeps it.
      due_date = case when p_header ? 'due_date' then v_due else v_existing.due_date end,
      amount_in_words = nullif(p_header->>'amount_in_words', ''),
      notes = nullif(p_header->>'notes', ''),
      status = coalesce(nullif(p_header->>'status', ''), v_existing.status),
      subtotal = coalesce(nullif(p_header->>'subtotal', '')::numeric, 0),
      discount = coalesce(nullif(p_header->>'discount', '')::numeric, 0),
      cgst_percent = coalesce(nullif(p_header->>'cgst_percent', '')::numeric, 0),
      sgst_percent = coalesce(nullif(p_header->>'sgst_percent', '')::numeric, 0),
      igst_percent = coalesce(nullif(p_header->>'igst_percent', '')::numeric, 0),
      cgst_amount = coalesce(nullif(p_header->>'cgst_amount', '')::numeric, 0),
      sgst_amount = coalesce(nullif(p_header->>'sgst_amount', '')::numeric, 0),
      igst_amount = coalesce(nullif(p_header->>'igst_amount', '')::numeric, 0),
      other_charges = coalesce(nullif(p_header->>'other_charges', '')::numeric, 0),
      grand_total = v_total,
      payment_status = public.resolve_invoice_payment_status(
        v_total, v_existing.payment_amount_received,
        case when p_header ? 'due_date' then v_due else v_existing.due_date end
      ),
      updated_at = timezone('utc'::text, now())
    where id = p_invoice_id;

    delete from public.challan_items where challan_id = p_invoice_id;
    v_id := p_invoice_id;
  end if;

  insert into public.challan_items (
    challan_id, product_id, description, quantity, quantity_display, unit,
    total_pieces, quality, fabric_name, color, design, roll_number, lot_number,
    meter, weight, rate, amount, remarks
  )
  select
    v_id,
    nullif(e->>'product_id', '')::uuid,
    nullif(e->>'description', ''),
    nullif(e->>'quantity', '')::numeric,
    nullif(e->>'quantity_display', ''),
    nullif(e->>'unit', ''),
    coalesce(nullif(e->>'total_pieces', '')::numeric, 1),
    nullif(e->>'quality', ''),
    nullif(e->>'fabric_name', ''),
    nullif(e->>'color', ''),
    nullif(e->>'design', ''),
    nullif(e->>'roll_number', ''),
    nullif(e->>'lot_number', ''),
    nullif(e->>'meter', '')::numeric,
    nullif(e->>'weight', '')::numeric,
    nullif(e->>'rate', '')::numeric,
    nullif(e->>'amount', '')::numeric,
    nullif(e->>'remarks', '')
  from jsonb_array_elements(p_items) as e;

  return v_id;
end;
$$;

-- ─── Invoice payment (ledger row + running total, atomically) ─────────────────
create or replace function public.record_invoice_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_date date,
  p_payment_mode text default null,
  p_reference text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_inv public.challans%rowtype;
  v_new_received numeric;
  v_payment_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  -- Row lock serialises concurrent payments on the same invoice.
  select * into v_inv
  from public.challans
  where id = p_invoice_id
  for update;

  if not found then
    -- FOR UPDATE only sees rows the caller may edit.
    if exists (select 1 from public.challans where id = p_invoice_id) then
      raise exception 'You do not have permission to record payments on this invoice';
    end if;
    raise exception 'Invoice not found';
  end if;

  v_new_received := v_inv.payment_amount_received + p_amount;
  if v_new_received > v_inv.grand_total + 0.01 then
    raise exception 'Payment amount exceeds remaining balance of ₹%',
      to_char(greatest(v_inv.grand_total - v_inv.payment_amount_received, 0), 'FM999999999990.00');
  end if;

  insert into public.challan_payments (
    challan_id, company_id, amount, payment_date, payment_mode,
    reference_number, notes, created_by
  ) values (
    p_invoice_id, v_inv.company_id, p_amount,
    coalesce(p_payment_date, (now() at time zone 'Asia/Kolkata')::date),
    p_payment_mode, p_reference, p_notes, auth.uid()
  )
  returning id into v_payment_id;

  update public.challans set
    payment_amount_received = v_new_received,
    payment_received_date = coalesce(p_payment_date, (now() at time zone 'Asia/Kolkata')::date),
    payment_mode = p_payment_mode,
    payment_reference = p_reference,
    payment_notes = p_notes,
    payment_status = public.resolve_invoice_payment_status(v_inv.grand_total, v_new_received, v_inv.due_date),
    updated_at = timezone('utc'::text, now())
  where id = p_invoice_id;

  return v_payment_id;
end;
$$;

-- ─── Delivery challan + taka items + stock, atomically ───────────────────────
-- Totals are computed here from the items. Rows with no taka number, meters or
-- weight are ignored (matches lib/challan-item.ts isBlankTakaRow).
-- Stock is charged for every status, as before (DATA-002 / decision K-3 will
-- decide how Returned and Cancelled restore stock).
create or replace function public.save_delivery_challan(
  p_challan_id uuid,
  p_header jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  v_company uuid := nullif(p_header->>'company_id', '')::uuid;
  v_stock uuid := nullif(p_header->>'stock_id', '')::uuid;
  v_existing public.delivery_challans%rowtype;
  v_pieces numeric;
  v_meters numeric;
  v_weight numeric;
  v_is_create boolean := p_challan_id is null;
  v_rows jsonb;
begin
  perform public._allow_document_stock_change();
  if v_company is null then
    raise exception 'company_id is required';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'items must be a JSON array';
  end if;

  -- Normalised, non-blank rows in their original order.
  select coalesce(jsonb_agg(jsonb_build_object(
           'taka_no', nullif(trim(e->>'taka_no'), ''),
           'meters', coalesce(nullif(e->>'meters', '')::numeric, 0),
           'weight', coalesce(nullif(e->>'weight', '')::numeric, 0)
         ) order by ord), '[]'::jsonb)
    into v_rows
  from jsonb_array_elements(p_items) with ordinality as t(e, ord)
  where nullif(trim(e->>'taka_no'), '') is not null
     or coalesce(nullif(e->>'meters', '')::numeric, 0) > 0
     or coalesce(nullif(e->>'weight', '')::numeric, 0) > 0;

  select count(*), coalesce(sum((r->>'meters')::numeric), 0), coalesce(sum((r->>'weight')::numeric), 0)
    into v_pieces, v_meters, v_weight
  from jsonb_array_elements(v_rows) as r;

  if v_is_create then
    insert into public.delivery_challans (
      company_id, customer_id, challan_number, date, quality, stock_id, broker,
      delivered_by, remarks, notes, status, total_pieces, total_meters,
      total_weight, created_by
    ) values (
      v_company,
      (p_header->>'customer_id')::uuid,
      p_header->>'challan_number',
      coalesce(nullif(p_header->>'date', '')::date, (now() at time zone 'Asia/Kolkata')::date),
      nullif(p_header->>'quality', ''),
      v_stock,
      nullif(p_header->>'broker', ''),
      nullif(p_header->>'delivered_by', ''),
      nullif(p_header->>'remarks', ''),
      nullif(p_header->>'notes', ''),
      coalesce(nullif(p_header->>'status', ''), 'Draft'),
      v_pieces, v_meters, v_weight,
      coalesce(nullif(p_header->>'created_by', '')::uuid, auth.uid())
    )
    returning id into v_id;
  else
    select * into v_existing
    from public.delivery_challans
    where id = p_challan_id
    for update;

    if not found then
      if exists (select 1 from public.delivery_challans where id = p_challan_id) then
        raise exception 'You do not have permission to edit this delivery challan';
      end if;
      raise exception 'Delivery challan not found';
    end if;
    if v_existing.company_id <> v_company then
      raise exception 'Delivery challan belongs to a different company';
    end if;

    update public.delivery_challans set
      customer_id = (p_header->>'customer_id')::uuid,
      challan_number = p_header->>'challan_number',
      date = coalesce(nullif(p_header->>'date', '')::date, v_existing.date),
      quality = nullif(p_header->>'quality', ''),
      stock_id = v_stock,
      broker = nullif(p_header->>'broker', ''),
      delivered_by = nullif(p_header->>'delivered_by', ''),
      remarks = nullif(p_header->>'remarks', ''),
      notes = nullif(p_header->>'notes', ''),
      status = coalesce(nullif(p_header->>'status', ''), v_existing.status),
      total_pieces = v_pieces,
      total_meters = v_meters,
      total_weight = v_weight
    where id = p_challan_id;

    delete from public.delivery_challan_items where delivery_challan_id = p_challan_id;
    v_id := p_challan_id;
  end if;

  insert into public.delivery_challan_items (delivery_challan_id, sort_order, taka_no, meters, weight)
  select v_id, (ord - 1)::integer, r->>'taka_no', (r->>'meters')::numeric, (r->>'weight')::numeric
  from jsonb_array_elements(v_rows) with ordinality as t(r, ord);

  -- Stock: release the previous usage, then charge the new one. Any stock error
  -- (e.g. "Only 12 Taka Available.") aborts the whole transaction.
  if v_is_create then
    if v_stock is not null and v_pieces > 0 then
      perform public.process_quality_stock_change(
        v_company, v_stock, v_pieces, 'Delivery Challan', 'delivery_challan',
        v_id, null, v_id, null, auth.uid()
      );
    end if;
  elsif v_existing.stock_id is not distinct from v_stock then
    if v_stock is not null and v_pieces <> v_existing.total_pieces then
      perform public.process_quality_stock_change(
        v_company, v_stock, v_pieces - v_existing.total_pieces, 'Delivery Challan Edit',
        'delivery_challan', v_id, null, v_id, null, auth.uid()
      );
    end if;
  else
    if v_existing.stock_id is not null and v_existing.total_pieces > 0 then
      perform public.process_quality_stock_change(
        v_company, v_existing.stock_id, -v_existing.total_pieces, 'Delivery Challan Edit',
        'delivery_challan', v_id, null, v_id, null, auth.uid()
      );
    end if;
    if v_stock is not null and v_pieces > 0 then
      perform public.process_quality_stock_change(
        v_company, v_stock, v_pieces, 'Delivery Challan Edit',
        'delivery_challan', v_id, null, v_id, null, auth.uid()
      );
    end if;
  end if;

  return v_id;
end;
$$;

create or replace function public.delete_delivery_challan(p_challan_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_company uuid;
  v_stock uuid;
  v_pieces numeric;
begin
  perform public._allow_document_stock_change();
  -- DELETE ... RETURNING locks the row and applies the delete permission;
  -- the stock reversal below rolls back with it if anything fails.
  delete from public.delivery_challans
  where id = p_challan_id
  returning company_id, stock_id, total_pieces into v_company, v_stock, v_pieces;

  if not found then
    raise exception 'Delivery challan not found or not allowed to delete it';
  end if;

  if v_stock is not null and v_pieces > 0 then
    perform public.process_quality_stock_change(
      v_company, v_stock, -v_pieces, 'Delivery Challan Delete', 'delivery_challan',
      p_challan_id, null, null, null, auth.uid()
    );
  end if;
end;
$$;

-- ─── Allow the movement type the stock screen has always written ────────────
-- services/stocks.service.ts records total edits as 'Manual Stock Adjustment',
-- but the constraint added in 20261006000001 only lists 'Manual Adjustment', so
-- every total edit failed after the stock row had already been updated.
alter table public.stock_movements drop constraint if exists stock_movements_transaction_type_check;
alter table public.stock_movements add constraint stock_movements_transaction_type_check
check (transaction_type in (
  'Opening Stock',
  'Sale',
  'Manual Adjustment',
  'Manual Stock Adjustment',
  'Delete Challan Restore',
  'Edit Challan Update',
  'Delivery Challan',
  'Delivery Challan Edit',
  'Delivery Challan Delete',
  'Purchase',
  'Purchase Return'
));

-- ─── Stock quality edit (total changes computed under a row lock) ────────────
-- Replaces read-then-write in the browser, which could overwrite sold_taka
-- changed by a delivery challan in between.
create or replace function public.update_stock_details(
  p_stock_id uuid,
  p_quality_name text,
  p_total_taka numeric,
  p_hsn_code text default null,
  p_remarks text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_stock public.stocks%rowtype;
  v_total numeric := greatest(coalesce(p_total_taka, 0), 0);
  v_available numeric;
begin
  select * into v_stock
  from public.stocks
  where id = p_stock_id
  for update;

  if not found then
    if exists (select 1 from public.stocks where id = p_stock_id) then
      raise exception 'You do not have permission to edit this stock quality';
    end if;
    raise exception 'Stock not found';
  end if;
  if v_total < v_stock.sold_taka then
    raise exception 'Total Taka cannot be less than Sold Taka (%).', trim_scale(v_stock.sold_taka);
  end if;

  v_available := v_total - v_stock.sold_taka;

  update public.stocks set
    quality_name = trim(p_quality_name),
    total_taka = v_total,
    available_taka = v_available,
    hsn_code = nullif(trim(coalesce(p_hsn_code, '')), ''),
    remarks = nullif(trim(coalesce(p_remarks, '')), ''),
    updated_at = now()
  where id = p_stock_id;

  if v_total <> v_stock.total_taka then
    insert into public.stock_movements (
      company_id, stock_id, transaction_type, quantity, previous_stock,
      current_stock, reference_type, notes, created_by
    ) values (
      v_stock.company_id, p_stock_id, 'Manual Stock Adjustment',
      abs(v_total - v_stock.total_taka), v_stock.available_taka, v_available,
      'manual', 'Manual total stock adjustment', auth.uid()
    );
  end if;
end;
$$;

-- ─── Purchase bill + items + stock + initial payment, atomically ─────────────
-- p_initial_payment: null or {"amount", "payment_method", "reference_number",
-- "notes", "payment_date"}. The header's paid / balance / status are derived
-- from it here, so the payment can never be counted twice.
create or replace function public.save_purchase(
  p_header jsonb,
  p_items jsonb,
  p_initial_payment jsonb default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  h public.purchases;
  v_id uuid;
  v_paid numeric := 0;
  v_total numeric;
  v_item record;
begin
  perform public._allow_document_stock_change();
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'items must be a JSON array';
  end if;

  h := jsonb_populate_record(null::public.purchases, p_header);
  if h.company_id is null then
    raise exception 'company_id is required';
  end if;
  v_total := coalesce(h.grand_total, 0);

  if p_initial_payment is not null then
    v_paid := coalesce(nullif(p_initial_payment->>'amount', '')::numeric, 0);
    if v_paid < 0 or v_paid > v_total + 0.01 then
      raise exception 'Paid amount must be between 0 and the bill total.';
    end if;
  else
    v_paid := coalesce(h.paid_amount, 0);
  end if;

  insert into public.purchases (
    company_id, supplier_id, supplier_name, supplier_gstin, invoice_number,
    invoice_date, due_date, financial_year, purchase_type, is_gst_bill, hsn_sac,
    subtotal, discount, gst_rate, cgst_amount, sgst_amount, igst_amount,
    total_gst, round_off, grand_total, payment_status, paid_amount,
    balance_amount, payment_method, status, notes, created_by
  ) values (
    h.company_id, h.supplier_id, trim(h.supplier_name), nullif(upper(trim(coalesce(h.supplier_gstin, ''))), ''),
    trim(h.invoice_number), h.invoice_date, h.due_date, h.financial_year,
    coalesce(h.purchase_type, 'Stock Purchase'), coalesce(h.is_gst_bill, true), nullif(trim(coalesce(h.hsn_sac, '')), ''),
    coalesce(h.subtotal, 0), coalesce(h.discount, 0), coalesce(h.gst_rate, 0),
    coalesce(h.cgst_amount, 0), coalesce(h.sgst_amount, 0), coalesce(h.igst_amount, 0),
    coalesce(h.total_gst, 0), coalesce(h.round_off, 0), v_total,
    case when v_paid <= 0 then 'Unpaid' when v_total - v_paid <= 0 then 'Paid' else 'Partially Paid' end,
    v_paid, greatest(v_total - v_paid, 0), h.payment_method,
    coalesce(h.status, 'Active'), h.notes, coalesce(h.created_by, auth.uid())
  )
  returning id into v_id;

  insert into public.purchase_items (
    purchase_id, product_id, stock_id, item_name, description, hsn_sac, quantity,
    unit, rate, discount, taxable_amount, gst_rate, gst_amount, total_amount,
    yarn_type, count, denier, color, lot_number, batch_number, roll_number,
    beam_number, quality, width, gsm, meters, weight
  )
  select
    v_id, i.product_id, i.stock_id, trim(i.item_name), nullif(trim(coalesce(i.description, '')), ''),
    nullif(trim(coalesce(i.hsn_sac, '')), ''), coalesce(nullif(i.quantity, 0), 1),
    coalesce(i.unit, 'Kg'), coalesce(i.rate, 0), coalesce(i.discount, 0),
    coalesce(i.taxable_amount, 0), coalesce(i.gst_rate, 0), coalesce(i.gst_amount, 0),
    coalesce(i.total_amount, 0), i.yarn_type, i.count, i.denier, i.color, i.lot_number,
    i.batch_number, i.roll_number, i.beam_number, i.quality, i.width, i.gsm, i.meters, i.weight
  from jsonb_populate_recordset(null::public.purchase_items, p_items) as i;

  -- Stock purchases add stock unless the bill is a Draft. Any stock error rolls
  -- back the whole bill.
  if coalesce(h.purchase_type, 'Stock Purchase') = 'Stock Purchase' and coalesce(h.status, 'Active') <> 'Draft' then
    for v_item in
      select stock_id, quantity from public.purchase_items
      where purchase_id = v_id and stock_id is not null and quantity > 0
    loop
      perform public.process_purchase_stock_change(
        h.company_id, v_item.stock_id, v_item.quantity, 'Purchase', v_id,
        format('Purchase Bill #%s from %s', trim(h.invoice_number), trim(h.supplier_name)),
        auth.uid()
      );
    end loop;
  end if;

  if p_initial_payment is not null and v_paid > 0 then
    insert into public.purchase_payments (
      company_id, purchase_id, amount, payment_method, reference_number, notes,
      payment_date, created_by
    ) values (
      h.company_id, v_id, v_paid,
      coalesce(nullif(p_initial_payment->>'payment_method', ''), 'Bank Transfer'),
      nullif(p_initial_payment->>'reference_number', ''),
      coalesce(nullif(p_initial_payment->>'notes', ''), 'Payment on bill creation'),
      coalesce(nullif(p_initial_payment->>'payment_date', '')::date, h.invoice_date),
      auth.uid()
    );
  end if;

  return v_id;
end;
$$;

-- Reverses the stock a bill added (never for Drafts, which added none) and
-- deletes it in one transaction. Stock already delivered blocks the delete.
create or replace function public.delete_purchase(p_purchase_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_items jsonb;
  v_company uuid;
  v_type text;
  v_status text;
  v_number text;
  v_item record;
  v_short record;
begin
  perform public._allow_document_stock_change();

  -- Items are removed by the cascade, so capture them first.
  select coalesce(jsonb_agg(jsonb_build_object('stock_id', stock_id, 'quantity', quantity)), '[]'::jsonb)
    into v_items
  from public.purchase_items
  where purchase_id = p_purchase_id and stock_id is not null and quantity > 0;

  -- DELETE ... RETURNING locks the row and applies the delete permission.
  delete from public.purchases
  where id = p_purchase_id
  returning company_id, purchase_type, status, invoice_number
    into v_company, v_type, v_status, v_number;

  if not found then
    if exists (select 1 from public.purchases where id = p_purchase_id) then
      raise exception 'You do not have permission to delete this purchase';
    end if;
    raise exception 'Purchase not found';
  end if;

  -- Drafts never added stock, so they remove none.
  if v_type = 'Stock Purchase' and v_status <> 'Draft' then
    -- Stock from this bill that has already been delivered cannot be taken back.
    select s.quality_name, s.available_taka, x.qty
      into v_short
    from (
      select (e->>'stock_id')::uuid as stock_id, sum((e->>'quantity')::numeric) as qty
      from jsonb_array_elements(v_items) e
      group by 1
    ) x
    join public.stocks s on s.id = x.stock_id
    where s.available_taka < x.qty
    limit 1;
    if found then
      raise exception 'Cannot delete this bill: only % of its % Taka of % are still in stock (the rest has been delivered).',
        trim_scale(v_short.available_taka), trim_scale(v_short.qty), v_short.quality_name;
    end if;

    for v_item in
      select (e->>'stock_id')::uuid as stock_id, (e->>'quantity')::numeric as quantity
      from jsonb_array_elements(v_items) e
    loop
      perform public.process_purchase_stock_change(
        v_company, v_item.stock_id, v_item.quantity, 'Purchase Return', p_purchase_id,
        format('Stock reversed on deletion of Purchase Bill #%s', v_number),
        auth.uid()
      );
    end loop;
  end if;
end;
$$;

-- ─── Purchase payment (ledger row + bill totals, atomically) ─────────────────
create or replace function public.record_purchase_payment(
  p_purchase_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_payment_date date default null,
  p_reference text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_p public.purchases%rowtype;
  v_paid numeric;
  v_balance numeric;
  v_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  select * into v_p from public.purchases where id = p_purchase_id for update;
  if not found then
    if exists (select 1 from public.purchases where id = p_purchase_id) then
      raise exception 'You do not have permission to record payments on this bill';
    end if;
    raise exception 'Purchase not found';
  end if;

  v_paid := v_p.paid_amount + p_amount;
  if v_paid > v_p.grand_total + 0.01 then
    raise exception 'Payment amount exceeds remaining balance of ₹%',
      to_char(greatest(v_p.grand_total - v_p.paid_amount, 0), 'FM999999999990.00');
  end if;
  v_balance := greatest(v_p.grand_total - v_paid, 0);

  insert into public.purchase_payments (
    company_id, purchase_id, amount, payment_method, reference_number, notes,
    payment_date, created_by
  ) values (
    v_p.company_id, p_purchase_id, p_amount, coalesce(p_payment_method, 'Bank Transfer'),
    p_reference, p_notes, coalesce(p_payment_date, (now() at time zone 'Asia/Kolkata')::date), auth.uid()
  )
  returning id into v_id;

  update public.purchases set
    paid_amount = v_paid,
    balance_amount = v_balance,
    payment_status = case when v_balance <= 0 then 'Paid' when v_paid <= 0 then 'Unpaid' else 'Partially Paid' end,
    updated_at = now()
  where id = p_purchase_id;

  return v_id;
end;
$$;

-- ─── Grants: signed-in users only (PUBLIC/anon get nothing) ──────────────────
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.resolve_invoice_payment_status(numeric, numeric, date)',
    'public.save_invoice(uuid, jsonb, jsonb)',
    'public.record_invoice_payment(uuid, numeric, date, text, text, text)',
    'public.save_delivery_challan(uuid, jsonb, jsonb)',
    'public.delete_delivery_challan(uuid)',
    'public.update_stock_details(uuid, text, numeric, text, text)',
    'public.save_purchase(jsonb, jsonb, jsonb)',
    'public.delete_purchase(uuid)',
    'public.record_purchase_payment(uuid, numeric, text, date, text, text)',
    'public._allow_document_stock_change()'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated, service_role', fn);
  end loop;
end;
$$;
