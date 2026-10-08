-- Migration: Personal Expense Categories unique index and seed fixes
-- 20261008000002_personal_expenses_category_fixes.sql

-- 1. Create unique index to prevent duplicate category names per user under the same parent
CREATE UNIQUE INDEX IF NOT EXISTS idx_personal_cat_user_name_parent 
ON public.personal_expense_categories (user_id, lower(trim(name)), coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 2. Update ensure_default_personal_categories with advisory lock & comprehensive subcategories
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

  -- Acquire an advisory xact lock keyed by the user's UUID hash to prevent concurrent duplicate seeding
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  SELECT count(*) INTO v_count
  FROM public.personal_expense_categories
  WHERE user_id = p_user_id;

  IF v_count > 0 THEN
    RETURN;
  END IF;

  -- 1. Food & Dining
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Food & Dining', '#f97316')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_parent_id;

  IF v_parent_id IS NOT NULL THEN
    INSERT INTO public.personal_expense_categories (user_id, name, parent_id) VALUES
      (p_user_id, 'Restaurant', v_parent_id),
      (p_user_id, 'Cafe', v_parent_id),
      (p_user_id, 'Delivery', v_parent_id),
      (p_user_id, 'Other', v_parent_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 2. Groceries
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Groceries', '#10b981')
  ON CONFLICT DO NOTHING;

  -- 3. Rent
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Rent', '#8b5cf6')
  ON CONFLICT DO NOTHING;

  -- 4. Electricity
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Electricity', '#eab308')
  ON CONFLICT DO NOTHING;

  -- 5. Water
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Water', '#06b6d4')
  ON CONFLICT DO NOTHING;

  -- 6. Gas
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Gas', '#f59e0b')
  ON CONFLICT DO NOTHING;

  -- 7. Internet
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Internet', '#3b82f6')
  ON CONFLICT DO NOTHING;

  -- 8. Mobile
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Mobile', '#6366f1')
  ON CONFLICT DO NOTHING;

  -- 9. Transportation
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Transportation', '#ec4899')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_parent_id;

  IF v_parent_id IS NOT NULL THEN
    INSERT INTO public.personal_expense_categories (user_id, name, parent_id) VALUES
      (p_user_id, 'Fuel', v_parent_id),
      (p_user_id, 'Taxi', v_parent_id),
      (p_user_id, 'Auto', v_parent_id),
      (p_user_id, 'Public Transport', v_parent_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 10. Fuel (Standalone)
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Fuel', '#ef4444')
  ON CONFLICT DO NOTHING;

  -- 11. Shopping
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Shopping', '#d946ef')
  ON CONFLICT DO NOTHING;

  -- 12. Clothing
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Clothing', '#a855f7')
  ON CONFLICT DO NOTHING;

  -- 13. Medical
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Medical', '#14b8a6')
  ON CONFLICT DO NOTHING;

  -- 14. Pharmacy
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Pharmacy', '#0d9488')
  ON CONFLICT DO NOTHING;

  -- 15. Education
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Education', '#0284c7')
  ON CONFLICT DO NOTHING;

  -- 16. Entertainment
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Entertainment', '#84cc16')
  ON CONFLICT DO NOTHING;

  -- 17. Travel
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Travel', '#f43f5e')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_parent_id;

  IF v_parent_id IS NOT NULL THEN
    INSERT INTO public.personal_expense_categories (user_id, name, parent_id) VALUES
      (p_user_id, 'Flight', v_parent_id),
      (p_user_id, 'Hotel', v_parent_id),
      (p_user_id, 'Taxi', v_parent_id),
      (p_user_id, 'Train', v_parent_id),
      (p_user_id, 'Other', v_parent_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 18. Hotel
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Hotel', '#fb7185')
  ON CONFLICT DO NOTHING;

  -- 19. Subscriptions
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Subscriptions', '#6366f1')
  ON CONFLICT DO NOTHING;

  -- 20. Home Maintenance
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Home Maintenance', '#0ea5e9')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_parent_id;

  IF v_parent_id IS NOT NULL THEN
    INSERT INTO public.personal_expense_categories (user_id, name, parent_id) VALUES
      (p_user_id, 'Maintenance', v_parent_id),
      (p_user_id, 'Repair', v_parent_id),
      (p_user_id, 'Cleaning', v_parent_id),
      (p_user_id, 'Other', v_parent_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 21. Electronics
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Electronics', '#64748b')
  ON CONFLICT DO NOTHING;

  -- 22. Gifts
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Gifts', '#ec4899')
  ON CONFLICT DO NOTHING;

  -- 23. Family
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Family', '#f59e0b')
  ON CONFLICT DO NOTHING;

  -- 24. Personal Care
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Personal Care', '#8b5cf6')
  ON CONFLICT DO NOTHING;

  -- 25. Insurance
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Insurance', '#0284c7')
  ON CONFLICT DO NOTHING;

  -- 26. EMI / Loan
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'EMI / Loan', '#ef4444')
  ON CONFLICT DO NOTHING;

  -- 27. Charity
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Charity', '#10b981')
  ON CONFLICT DO NOTHING;

  -- 28. Other
  INSERT INTO public.personal_expense_categories (user_id, name, color)
  VALUES (p_user_id, 'Other', '#94a3b8')
  ON CONFLICT DO NOTHING;

END;
$$;
