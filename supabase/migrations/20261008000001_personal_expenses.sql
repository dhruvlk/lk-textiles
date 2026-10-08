-- ==============================================================================
-- Migration: Personal Expenses Module
-- Date: 2026-10-08
-- Description: Isolated user-scoped personal and household expense tracking,
--              categories/subcategories, attachments, numbering, and audit logs.
-- ==============================================================================

-- 1. Personal Expense Categories & Subcategories
CREATE TABLE IF NOT EXISTS public.personal_expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.personal_expense_categories(id) ON DELETE CASCADE,
  color text DEFAULT '#4f46e5',
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_cat_user ON public.personal_expense_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_cat_parent ON public.personal_expense_categories(parent_id);

ALTER TABLE public.personal_expense_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view categories" ON public.personal_expense_categories;
CREATE POLICY "Users can view categories"
  ON public.personal_expense_categories FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert categories" ON public.personal_expense_categories;
CREATE POLICY "Users can insert categories"
  ON public.personal_expense_categories FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own categories" ON public.personal_expense_categories;
CREATE POLICY "Users can update own categories"
  ON public.personal_expense_categories FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own categories" ON public.personal_expense_categories;
CREATE POLICY "Users can delete own categories"
  ON public.personal_expense_categories FOR DELETE
  USING (user_id = auth.uid());


-- 2. Personal Expense Settings
CREATE TABLE IF NOT EXISTS public.personal_expense_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_number_prefix text NOT NULL DEFAULT 'PE-',
  starting_number integer NOT NULL DEFAULT 1,
  next_number integer NOT NULL DEFAULT 1,
  default_currency text NOT NULL DEFAULT 'INR',
  default_payment_method text NOT NULL DEFAULT 'Cash',
  custom_payment_methods text[] DEFAULT ARRAY['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Cheque', 'Other']::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_settings_user ON public.personal_expense_settings(user_id);

ALTER TABLE public.personal_expense_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own personal settings" ON public.personal_expense_settings;
CREATE POLICY "Users can access own personal settings"
  ON public.personal_expense_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- 3. Personal Expenses Table
CREATE TABLE IF NOT EXISTS public.personal_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_number text NOT NULL,
  expense_date date NOT NULL DEFAULT current_date,
  category_id uuid REFERENCES public.personal_expense_categories(id) ON DELETE SET NULL,
  category_name text NOT NULL,
  subcategory_id uuid REFERENCES public.personal_expense_categories(id) ON DELETE SET NULL,
  subcategory_name text,
  description text NOT NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'Cash',
  payment_status text NOT NULL DEFAULT 'Paid'
    CHECK (payment_status IN ('Paid', 'Pending', 'Partially Paid')),
  paid_amount numeric(14,2) NOT NULL DEFAULT 0,
  pending_amount numeric(14,2) NOT NULL DEFAULT 0,
  paid_to text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_expenses_user_date ON public.personal_expenses(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_personal_expenses_user_cat ON public.personal_expenses(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_personal_expenses_user_num ON public.personal_expenses(user_id, expense_number);
CREATE INDEX IF NOT EXISTS idx_personal_expenses_user_status ON public.personal_expenses(user_id, payment_status);

ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own personal expenses" ON public.personal_expenses;
CREATE POLICY "Users can access own personal expenses"
  ON public.personal_expenses FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- 4. Personal Expense Documents (Attachments)
CREATE TABLE IF NOT EXISTS public.personal_expense_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.personal_expenses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_docs_expense ON public.personal_expense_documents(expense_id);
CREATE INDEX IF NOT EXISTS idx_personal_docs_user ON public.personal_expense_documents(user_id);

ALTER TABLE public.personal_expense_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own personal expense docs" ON public.personal_expense_documents;
CREATE POLICY "Users can access own personal expense docs"
  ON public.personal_expense_documents FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- 5. Personal Expense Audit Logs
CREATE TABLE IF NOT EXISTS public.personal_expense_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_id uuid REFERENCES public.personal_expenses(id) ON DELETE CASCADE,
  action text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_logs_expense ON public.personal_expense_audit_logs(expense_id);
CREATE INDEX IF NOT EXISTS idx_personal_logs_user ON public.personal_expense_audit_logs(user_id, created_at DESC);

ALTER TABLE public.personal_expense_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own personal expense logs" ON public.personal_expense_audit_logs;
CREATE POLICY "Users can access own personal expense logs"
  ON public.personal_expense_audit_logs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- 6. Server-side Transaction-safe Expense Number Generator
CREATE OR REPLACE FUNCTION public.generate_personal_expense_number(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text := 'PE-';
  v_next_num integer := 1;
  v_exp_number text;
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role' AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.personal_expense_settings (user_id, expense_number_prefix, starting_number, next_number)
  VALUES (p_user_id, 'PE-', 1, 1)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT expense_number_prefix, next_number
    INTO v_prefix, v_next_num
  FROM public.personal_expense_settings
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_exp_number := coalesce(v_prefix, 'PE-') || lpad(v_next_num::text, 6, '0');

  UPDATE public.personal_expense_settings
  SET next_number = v_next_num + 1,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN v_exp_number;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_personal_expense_number(uuid) TO authenticated;


-- 7. Ensure Default Personal Categories for a User
CREATE OR REPLACE FUNCTION public.ensure_default_personal_categories(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_parent_id uuid;
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role' AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.personal_expense_categories
  WHERE user_id = p_user_id;

  IF v_count > 0 THEN
    RETURN;
  END IF;

  -- 1. Food & Dining
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Food & Dining', '#f97316') RETURNING id INTO v_parent_id;
  INSERT INTO public.personal_expense_categories (user_id, name, parent_id) VALUES
    (p_user_id, 'Restaurant', v_parent_id),
    (p_user_id, 'Cafe', v_parent_id),
    (p_user_id, 'Delivery', v_parent_id),
    (p_user_id, 'Other', v_parent_id);

  -- 2. Groceries
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Groceries', '#10b981');

  -- 3. Rent
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Rent', '#8b5cf6');

  -- 4. Electricity
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Electricity', '#eab308');

  -- 5. Water
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Water', '#06b6d4');

  -- 6. Gas
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Gas', '#f59e0b');

  -- 7. Internet
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Internet', '#3b82f6');

  -- 8. Mobile
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Mobile', '#6366f1');

  -- 9. Transportation
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Transportation', '#ec4899') RETURNING id INTO v_parent_id;
  INSERT INTO public.personal_expense_categories (user_id, name, parent_id) VALUES
    (p_user_id, 'Fuel', v_parent_id),
    (p_user_id, 'Taxi', v_parent_id),
    (p_user_id, 'Auto', v_parent_id),
    (p_user_id, 'Public Transport', v_parent_id);

  -- 10. Fuel (Standalone category as well)
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Fuel', '#ef4444');

  -- 11. Shopping
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Shopping', '#d946ef');

  -- 12. Clothing
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Clothing', '#a855f7');

  -- 13. Medical
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Medical', '#14b8a6');

  -- 14. Pharmacy
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Pharmacy', '#0d9488');

  -- 15. Education
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Education', '#0284c7');

  -- 16. Entertainment
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Entertainment', '#84cc16');

  -- 17. Travel
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Travel', '#f43f5e');

  -- 18. Hotel
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Hotel', '#fb7185');

  -- 19. Subscriptions
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Subscriptions', '#64748b');

  -- 20. Home Maintenance
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Home Maintenance', '#78716c') RETURNING id INTO v_parent_id;
  INSERT INTO public.personal_expense_categories (user_id, name, parent_id) VALUES
    (p_user_id, 'Maintenance', v_parent_id),
    (p_user_id, 'Repair', v_parent_id),
    (p_user_id, 'Cleaning', v_parent_id),
    (p_user_id, 'Other', v_parent_id);

  -- 21. Electronics
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Electronics', '#475569');

  -- 22. Gifts
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Gifts', '#f472b6');

  -- 23. Family
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Family', '#38bdf8');

  -- 24. Personal Care
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Personal Care', '#fb923c');

  -- 25. Insurance
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Insurance', '#334155');

  -- 26. EMI / Loan
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'EMI / Loan', '#991b1b');

  -- 27. Charity
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Charity', '#059669');

  -- 28. Other
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Other', '#94a3b8');

END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_default_personal_categories(uuid) TO authenticated;


-- 8. Storage bucket & Storage policies for personal-documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'personal-documents',
  'personal-documents',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can view own personal documents" ON storage.objects;
CREATE POLICY "Users can view own personal documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'personal-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can upload own personal documents" ON storage.objects;
CREATE POLICY "Users can upload own personal documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'personal-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own personal documents" ON storage.objects;
CREATE POLICY "Users can delete own personal documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'personal-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
