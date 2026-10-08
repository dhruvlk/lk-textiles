-- Migration: Add default_category_id to personal_expense_settings
-- 20261008000003_personal_settings_default_category.sql

ALTER TABLE public.personal_expense_settings 
ADD COLUMN IF NOT EXISTS default_category_id uuid REFERENCES public.personal_expense_categories(id) ON DELETE SET NULL;
