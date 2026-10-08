-- Correct previous_stock and current_stock in process_purchase_stock_change
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
  v_total numeric;
  v_sold numeric;
  v_prev_available numeric;
  v_new_total numeric;
  v_new_available numeric;
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role' AND NOT public.user_belongs_to_company(p_company_id) THEN
    RAISE EXCEPTION 'Unauthorized company access';
  END IF;

  IF p_quantity = 0 THEN
    RETURN;
  END IF;

  SELECT coalesce(total_taka, 0), coalesce(sold_taka, 0), coalesce(available_taka, 0)
    INTO v_total, v_sold, v_prev_available
  FROM public.stocks
  WHERE id = p_stock_id
    AND company_id = p_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock item not found';
  END IF;

  IF p_transaction_type = 'Purchase' THEN
    -- Quantity added to stock
    v_new_total := v_total + abs(p_quantity);
    v_new_available := v_prev_available + abs(p_quantity);

    UPDATE public.stocks
    SET available_taka = v_new_available,
        total_taka = v_new_total,
        updated_at = now()
    WHERE id = p_stock_id;

    -- Record stock movement
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
      'Purchase',
      abs(p_quantity),
      v_prev_available,
      v_new_available,
      'purchase',
      p_purchase_id,
      coalesce(p_notes, 'Stock added via purchase'),
      p_user_id
    );

  ELSIF p_transaction_type IN ('Purchase Return', 'Purchase Cancelled', 'Purchase Delete') THEN
    -- Quantity deducted from stock (reversal)
    v_new_total := greatest(0, v_total - abs(p_quantity));
    v_new_available := greatest(0, v_prev_available - abs(p_quantity));

    UPDATE public.stocks
    SET available_taka = v_new_available,
        total_taka = v_new_total,
        updated_at = now()
    WHERE id = p_stock_id;

    -- Record stock movement
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
      'Purchase Return',
      abs(p_quantity),
      v_prev_available,
      v_new_available,
      'purchase',
      p_purchase_id,
      coalesce(p_notes, 'Stock reversed from purchase cancellation'),
      p_user_id
    );

  ELSE
    RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_purchase_stock_change(uuid, uuid, numeric, text, uuid, text, uuid) TO authenticated, service_role;
