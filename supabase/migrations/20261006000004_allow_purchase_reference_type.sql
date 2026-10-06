-- Allow 'purchase' in stock_movements_reference_type_check
ALTER TABLE public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_reference_type_check;
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_reference_type_check
  CHECK (
    reference_type IS NULL
    OR reference_type IN ('delivery_challan', 'manual', 'purchase')
  );
