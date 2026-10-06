-- Allow service_role or user_belongs_to_company in process_purchase_stock_change
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

    -- Record stock movement
    INSERT INTO public.stock_movements (
      company_id,
      stock_id,
      quantity,
      transaction_type,
      notes,
      reference_type,
      reference_id,
      created_by
    ) VALUES (
      p_company_id,
      p_stock_id,
      abs(p_quantity),
      'Purchase',
      coalesce(p_notes, 'Stock added via purchase'),
      'purchase',
      p_purchase_id,
      p_user_id
    );

  ELSIF p_transaction_type IN ('Purchase Return', 'Purchase Cancelled', 'Purchase Delete') THEN
    -- Quantity deducted from stock (reversal)
    v_new := greatest(0, v_prev - abs(p_quantity));
    UPDATE public.stocks
    SET available_taka = v_new,
        total_taka = greatest(0, v_total - abs(p_quantity)),
        updated_at = now()
    WHERE id = p_stock_id;

    -- Record stock movement
    INSERT INTO public.stock_movements (
      company_id,
      stock_id,
      quantity,
      transaction_type,
      notes,
      reference_type,
      reference_id,
      created_by
    ) VALUES (
      p_company_id,
      p_stock_id,
      -abs(p_quantity),
      'Purchase Return',
      coalesce(p_notes, 'Stock reversed from purchase cancellation'),
      'purchase',
      p_purchase_id,
      p_user_id
    );

  ELSE
    RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_purchase_stock_change(uuid, uuid, numeric, text, uuid, text, uuid) TO authenticated, service_role;
