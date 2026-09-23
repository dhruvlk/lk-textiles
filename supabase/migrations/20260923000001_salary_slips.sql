-- Salary Slips module migration
-- 1. Extend company_members with employee profile attributes
ALTER TABLE public.company_members
  ADD COLUMN IF NOT EXISTS employee_code text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS joining_date date,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS bank_ifsc text,
  ADD COLUMN IF NOT EXISTS pan_number text,
  ADD COLUMN IF NOT EXISTS uan_number text,
  ADD COLUMN IF NOT EXISTS pf_number text;

-- 2. Create salary_slips table
CREATE TABLE IF NOT EXISTS public.salary_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  employee_code text,
  designation text,
  department text,
  joining_date date,
  bank_name text,
  bank_account_number text,
  bank_ifsc text,
  pan_number text,
  uan_number text,
  pf_number text,
  salary_slip_number text NOT NULL,
  salary_month text NOT NULL,
  salary_year integer NOT NULL,
  pay_date date NOT NULL DEFAULT current_date,
  -- Earnings
  basic_salary numeric(12,2) NOT NULL DEFAULT 0,
  hra numeric(12,2) NOT NULL DEFAULT 0,
  conveyance numeric(12,2) NOT NULL DEFAULT 0,
  medical_allowance numeric(12,2) NOT NULL DEFAULT 0,
  special_allowance numeric(12,2) NOT NULL DEFAULT 0,
  bonus numeric(12,2) NOT NULL DEFAULT 0,
  overtime numeric(12,2) NOT NULL DEFAULT 0,
  other_earnings numeric(12,2) NOT NULL DEFAULT 0,
  gross_earnings numeric(12,2) NOT NULL DEFAULT 0,
  -- Deductions
  pf numeric(12,2) NOT NULL DEFAULT 0,
  professional_tax numeric(12,2) NOT NULL DEFAULT 0,
  tds numeric(12,2) NOT NULL DEFAULT 0,
  esic numeric(12,2) NOT NULL DEFAULT 0,
  loan_deduction numeric(12,2) NOT NULL DEFAULT 0,
  advance_deduction numeric(12,2) NOT NULL DEFAULT 0,
  other_deduction numeric(12,2) NOT NULL DEFAULT 0,
  total_deductions numeric(12,2) NOT NULL DEFAULT 0,
  -- Totals & Info
  net_salary numeric(12,2) NOT NULL DEFAULT 0,
  amount_in_words text,
  notes text,
  payment_status text NOT NULL DEFAULT 'Pending'
    CHECK (payment_status IN ('Pending', 'Paid', 'Partially Paid')),
  payment_mode text,
  payment_date date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, salary_slip_number)
);

CREATE INDEX IF NOT EXISTS idx_salary_slips_company
  ON public.salary_slips(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_salary_slips_period
  ON public.salary_slips(company_id, salary_year DESC, salary_month);

CREATE INDEX IF NOT EXISTS idx_salary_slips_employee
  ON public.salary_slips(company_id, employee_id);

-- 3. Salary Slip Sequences
CREATE TABLE IF NOT EXISTS public.salary_slip_sequences (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  last_number integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.salary_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_slip_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can access salary slips" ON public.salary_slips;
CREATE POLICY "Members can access salary slips"
  ON public.salary_slips FOR ALL
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

DROP POLICY IF EXISTS "Members can access salary slip sequences" ON public.salary_slip_sequences;
CREATE POLICY "Members can access salary slip sequences"
  ON public.salary_slip_sequences FOR ALL
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

-- 5. Auto updated_at trigger
CREATE OR REPLACE FUNCTION public.set_salary_slips_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS update_salary_slips_updated_at ON public.salary_slips;
CREATE TRIGGER update_salary_slips_updated_at
  BEFORE UPDATE ON public.salary_slips
  FOR EACH ROW EXECUTE FUNCTION public.set_salary_slips_updated_at();

-- 6. Generate Salary Slip Number RPC
CREATE OR REPLACE FUNCTION public.generate_salary_slip_number(
  p_company_id uuid,
  p_month text DEFAULT NULL,
  p_year integer DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next integer;
  v_year text;
  v_month_num text;
  v_month_lower text;
BEGIN
  IF NOT public.user_belongs_to_company(p_company_id) THEN
    RAISE EXCEPTION 'Unauthorized company access';
  END IF;

  INSERT INTO public.salary_slip_sequences (company_id, last_number)
  VALUES (p_company_id, 0)
  ON CONFLICT (company_id) DO NOTHING;

  UPDATE public.salary_slip_sequences
  SET last_number = last_number + 1,
      updated_at = now()
  WHERE company_id = p_company_id
  RETURNING last_number INTO v_next;

  v_year := coalesce(p_year::text, extract(year FROM current_date)::text);

  IF p_month IS NOT NULL AND p_month <> '' THEN
    v_month_lower := lower(trim(p_month));
    v_month_num := CASE v_month_lower
      WHEN 'january' THEN '01'
      WHEN 'february' THEN '02'
      WHEN 'march' THEN '03'
      WHEN 'april' THEN '04'
      WHEN 'may' THEN '05'
      WHEN 'june' THEN '06'
      WHEN 'july' THEN '07'
      WHEN 'august' THEN '08'
      WHEN 'september' THEN '09'
      WHEN 'october' THEN '10'
      WHEN 'november' THEN '11'
      WHEN 'december' THEN '12'
      ELSE lpad(p_month, 2, '0')
    END;
  ELSE
    v_month_num := lpad(extract(month FROM current_date)::text, 2, '0');
  END IF;

  RETURN 'SAL-' || v_year || '-' || v_month_num || '-' || lpad(v_next::text, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_salary_slip_number(uuid, text, integer) TO authenticated;

-- 7. Update employee_permissions module constraint
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
  'salary_slips'
));

-- 8. Enhanced list_company_employees to return the new employee profile columns
CREATE OR REPLACE FUNCTION public.list_company_employees(p_company_id uuid)
RETURNS table (
  membership_id uuid,
  user_id uuid,
  company_id uuid,
  role text,
  designation text,
  is_active boolean,
  invited_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  full_name text,
  email text,
  mobile text,
  avatar_url text,
  employee_code text,
  department text,
  joining_date date,
  bank_name text,
  bank_account_number text,
  bank_ifsc text,
  pan_number text,
  uan_number text,
  pf_number text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_has_company_role(p_company_id, array['Owner']::text[]) THEN
    RAISE EXCEPTION 'Only the company owner can list employees';
  END IF;

  RETURN QUERY
  SELECT
    cm.id AS membership_id,
    cm.user_id,
    cm.company_id,
    cm.role,
    cm.designation,
    cm.is_active,
    cm.invited_by,
    cm.created_at,
    cm.updated_at,
    coalesce(p.full_name, split_part(au.email, '@', 1), 'Employee') AS full_name,
    coalesce(p.email, au.email, '') AS email,
    p.mobile,
    p.avatar_url,
    cm.employee_code,
    cm.department,
    cm.joining_date,
    cm.bank_name,
    cm.bank_account_number,
    cm.bank_ifsc,
    cm.pan_number,
    cm.uan_number,
    cm.pf_number
  FROM public.company_members cm
  LEFT JOIN public.profiles p ON p.id = cm.user_id
  LEFT JOIN auth.users au ON au.id = cm.user_id
  WHERE cm.company_id = p_company_id
    AND cm.role <> 'Owner'
  ORDER BY cm.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_company_employees(uuid) TO authenticated;
