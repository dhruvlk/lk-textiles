-- ==============================================================================
-- Migration: Purchases, Expenses, GST Document Vault & Financial Year Management
-- Date: 2026-10-06
-- ==============================================================================

-- 1. Suppliers / Vendors Master
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_person text,
  mobile text,
  email text,
  address text,
  city text,
  state text,
  pincode text,
  gstin text,
  pan text,
  payment_terms text,
  opening_balance numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_company ON public.suppliers(company_id, name);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_gstin ON public.suppliers(company_id, gstin);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can access suppliers" ON public.suppliers;
CREATE POLICY "Members can access suppliers"
  ON public.suppliers FOR ALL
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

-- 2. Expense Categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#64748b',
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_company ON public.expense_categories(company_id);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can access expense categories" ON public.expense_categories;
CREATE POLICY "Members can access expense categories"
  ON public.expense_categories FOR ALL
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

-- 3. Purchases
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name text NOT NULL,
  supplier_gstin text,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  due_date date,
  financial_year text NOT NULL,
  purchase_type text NOT NULL DEFAULT 'Stock Purchase'
    CHECK (purchase_type IN ('Stock Purchase', 'Expense Purchase', 'Asset Purchase', 'Service Purchase', 'Other')),
  is_gst_bill boolean NOT NULL DEFAULT true,
  hsn_sac text,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  gst_rate numeric(5,2) NOT NULL DEFAULT 0,
  cgst_amount numeric(14,2) NOT NULL DEFAULT 0,
  sgst_amount numeric(14,2) NOT NULL DEFAULT 0,
  igst_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_gst numeric(14,2) NOT NULL DEFAULT 0,
  round_off numeric(10,2) NOT NULL DEFAULT 0,
  grand_total numeric(14,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'Unpaid'
    CHECK (payment_status IN ('Paid', 'Partially Paid', 'Unpaid')),
  paid_amount numeric(14,2) NOT NULL DEFAULT 0,
  balance_amount numeric(14,2) NOT NULL DEFAULT 0,
  payment_method text
    CHECK (payment_method IS NULL OR payment_method IN ('Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card', 'Other')),
  status text NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Draft', 'Active', 'Archived', 'Cancelled')),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchases_company_date ON public.purchases(company_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_company_fy ON public.purchases(company_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_purchases_company_supplier ON public.purchases(company_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_company_invoice ON public.purchases(company_id, invoice_number);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can access purchases" ON public.purchases;
CREATE POLICY "Members can access purchases"
  ON public.purchases FOR ALL
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

-- 4. Purchase Items
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  stock_id uuid REFERENCES public.stocks(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  description text,
  hsn_sac text,
  quantity numeric(14,2) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'Kg',
  rate numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  taxable_amount numeric(14,2) NOT NULL DEFAULT 0,
  gst_rate numeric(5,2) NOT NULL DEFAULT 0,
  gst_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  -- Textile specific fields
  yarn_type text,
  count text,
  denier text,
  color text,
  lot_number text,
  batch_number text,
  roll_number text,
  beam_number text,
  quality text,
  width text,
  gsm text,
  meters numeric(14,2),
  weight numeric(14,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON public.purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_stock ON public.purchase_items(stock_id);

ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can access purchase items" ON public.purchase_items;
CREATE POLICY "Members can access purchase items"
  ON public.purchase_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.purchases p
      WHERE p.id = purchase_items.purchase_id
        AND public.user_belongs_to_company(p.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchases p
      WHERE p.id = purchase_items.purchase_id
        AND public.user_belongs_to_company(p.company_id)
    )
  );

-- 5. Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  expense_date date NOT NULL,
  financial_year text NOT NULL,
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  category_name text NOT NULL,
  paid_to text NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  is_gst_applicable boolean NOT NULL DEFAULT false,
  vendor_gstin text,
  hsn_sac text,
  taxable_amount numeric(14,2) NOT NULL DEFAULT 0,
  gst_rate numeric(5,2) NOT NULL DEFAULT 0,
  cgst_amount numeric(14,2) NOT NULL DEFAULT 0,
  sgst_amount numeric(14,2) NOT NULL DEFAULT 0,
  igst_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_gst numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'Bank Transfer'
    CHECK (payment_method IN ('Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card', 'Other')),
  payment_status text NOT NULL DEFAULT 'Paid'
    CHECK (payment_status IN ('Paid', 'Partially Paid', 'Unpaid')),
  paid_amount numeric(14,2) NOT NULL DEFAULT 0,
  reference_number text,
  notes text,
  status text NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Active', 'Archived')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_company_date ON public.expenses(company_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_company_fy ON public.expenses(company_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_expenses_company_category ON public.expenses(company_id, category_id);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can access expenses" ON public.expenses;
CREATE POLICY "Members can access expenses"
  ON public.expenses FOR ALL
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

-- 6. Payments Ledger (Purchases & Expenses)
CREATE TABLE IF NOT EXISTS public.purchase_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE CASCADE,
  expense_id uuid REFERENCES public.expenses(id) ON DELETE CASCADE,
  payment_date date NOT NULL DEFAULT current_date,
  amount numeric(14,2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'Bank Transfer'
    CHECK (payment_method IN ('Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card', 'Other')),
  reference_number text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_payments_purchase ON public.purchase_payments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_payments_expense ON public.purchase_payments(expense_id);
CREATE INDEX IF NOT EXISTS idx_purchase_payments_company ON public.purchase_payments(company_id, payment_date DESC);

ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can access purchase payments" ON public.purchase_payments;
CREATE POLICY "Members can access purchase payments"
  ON public.purchase_payments FOR ALL
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

-- 7. Document Vault
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  financial_year text NOT NULL,
  document_type text NOT NULL DEFAULT 'Purchase Bill'
    CHECK (document_type IN ('Purchase Bill', 'Expense Bill', 'GST Document', 'Transport Bill', 'Machine Bill', 'Other')),
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE CASCADE,
  expense_id uuid REFERENCES public.expenses(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  public_url text,
  tags text[] DEFAULT array[]::text[],
  description text,
  ocr_data jsonb,
  status text NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Draft', 'Active', 'Archived')),
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_company ON public.documents(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_company_fy ON public.documents(company_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_documents_purchase ON public.documents(purchase_id);
CREATE INDEX IF NOT EXISTS idx_documents_expense ON public.documents(expense_id);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can access documents" ON public.documents;
CREATE POLICY "Members can access documents"
  ON public.documents FOR ALL
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

-- 8. Financial Years Master
CREATE TABLE IF NOT EXISTS public.financial_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year_label text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'Open'
    CHECK (status IN ('Open', 'Reviewing', 'Closed')),
  closing_notes text,
  closed_at timestamptz,
  closed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, year_label)
);

CREATE INDEX IF NOT EXISTS idx_financial_years_company ON public.financial_years(company_id);

ALTER TABLE public.financial_years ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can access financial years" ON public.financial_years;
CREATE POLICY "Members can access financial years"
  ON public.financial_years FOR ALL
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

-- 9. Update employee permissions constraint to include 'purchases'
ALTER TABLE public.employee_permissions DROP CONSTRAINT IF EXISTS employee_permissions_module_check;
ALTER TABLE public.employee_permissions ADD CONSTRAINT employee_permissions_module_check 
CHECK (module IN (
  'dashboard',
  'companies',
  'customers',
  'delivery_challans',
  'invoices',
  'stock',
  'reports',
  'employees',
  'settings',
  'products',
  'letter_pads',
  'salary_slips',
  'purchases'
));

-- 10. Update stock_movements transaction_type constraint to allow 'Purchase'
ALTER TABLE public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_transaction_type_check;
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_transaction_type_check
CHECK (transaction_type IN (
  'Opening Stock',
  'Sale',
  'Manual Adjustment',
  'Delete Challan Restore',
  'Edit Challan Update',
  'Delivery Challan',
  'Delivery Challan Edit',
  'Delivery Challan Delete',
  'Purchase',
  'Purchase Return'
));

-- 11. RPC for purchase stock increment / reversal
CREATE OR REPLACE FUNCTION public.process_purchase_stock_change(
  p_company_id uuid,
  p_stock_id uuid,
  p_quantity numeric,
  p_transaction_type text,
  p_purchase_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev numeric;
  v_new numeric;
  v_total numeric;
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role' AND NOT public.user_belongs_to_company(p_company_id) THEN
    RAISE EXCEPTION 'Unauthorized company access';
  END IF;

  IF p_quantity = 0 THEN
    RETURN;
  END IF;

  SELECT available_taka, total_taka
    INTO v_prev, v_total
  FROM public.stocks
  WHERE id = p_stock_id
    AND company_id = p_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock item not found';
  END IF;

  IF p_transaction_type = 'Purchase' THEN
    -- Quantity added to stock
    v_new := v_prev + abs(p_quantity);
    UPDATE public.stocks
    SET available_taka = v_new,
        total_taka = v_total + abs(p_quantity),
        updated_at = now()
    WHERE id = p_stock_id;
  ELSE
    -- Purchase cancellation/reversal: deduct from stock
    v_new := v_prev - abs(p_quantity);
    IF v_new < 0 THEN
      RAISE EXCEPTION 'Cannot reverse purchase: Stock level cannot be negative (Current: %)', round(v_prev, 2);
    END IF;
    UPDATE public.stocks
    SET available_taka = v_new,
        total_taka = greatest(0, v_total - abs(p_quantity)),
        updated_at = now()
    WHERE id = p_stock_id;
  END IF;

  INSERT INTO public.stock_movements (
    company_id,
    stock_id,
    transaction_type,
    quantity,
    previous_stock,
    current_stock,
    reference_type,
    reference_id,
    notes,
    created_by
  ) VALUES (
    p_company_id,
    p_stock_id,
    p_transaction_type,
    abs(p_quantity),
    v_prev,
    v_new,
    'purchase',
    p_purchase_id,
    p_notes,
    p_user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_purchase_stock_change(uuid, uuid, numeric, text, uuid, text, uuid) TO authenticated;

-- 12. Storage policies for company-documents bucket
DROP POLICY IF EXISTS "Members can access company documents" ON storage.objects;
DROP POLICY IF EXISTS "Members can upload company documents" ON storage.objects;
DROP POLICY IF EXISTS "Members can delete company documents" ON storage.objects;

CREATE POLICY "Members can access company documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'company-documents'
    AND (
      public.user_belongs_to_company(((storage.foldername(name))[1])::uuid)
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Members can upload company documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-documents'
    AND (
      public.user_belongs_to_company(((storage.foldername(name))[1])::uuid)
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Members can delete company documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-documents'
    AND (
      public.user_belongs_to_company(((storage.foldername(name))[1])::uuid)
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );
