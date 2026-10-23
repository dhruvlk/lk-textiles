import { createClient } from '@/lib/supabase/client';

/**
 * Transactional database functions (supabase/migrations/20261023000001_*).
 * Listed here because types/database.ts does not include them yet (TECH-003).
 */
export type TransactionalRpcs = {
  save_invoice: {
    args: { p_invoice_id: string | null; p_header: Record<string, unknown>; p_items: Record<string, unknown>[] };
    returns: string;
  };
  record_invoice_payment: {
    args: {
      p_invoice_id: string;
      p_amount: number;
      p_payment_date: string | null;
      p_payment_mode?: string | null;
      p_reference?: string | null;
      p_notes?: string | null;
    };
    returns: string;
  };
  save_delivery_challan: {
    args: { p_challan_id: string | null; p_header: Record<string, unknown>; p_items: Record<string, unknown>[] };
    returns: string;
  };
  delete_delivery_challan: { args: { p_challan_id: string }; returns: null };
  save_purchase: {
    args: {
      p_header: Record<string, unknown>;
      p_items: Record<string, unknown>[];
      p_initial_payment: Record<string, unknown> | null;
    };
    returns: string;
  };
  delete_purchase: { args: { p_purchase_id: string }; returns: null };
  record_purchase_payment: {
    args: {
      p_purchase_id: string;
      p_amount: number;
      p_payment_method: string;
      p_payment_date?: string | null;
      p_reference?: string | null;
      p_notes?: string | null;
    };
    returns: string;
  };
  update_stock_details: {
    args: {
      p_stock_id: string;
      p_quality_name: string;
      p_total_taka: number;
      p_hsn_code?: string | null;
      p_remarks?: string | null;
    };
    returns: null;
  };
};

type RpcClient = {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

/** Calls one of the transactional RPCs and throws its database error message on failure. */
export async function callTransactionalRpc<K extends keyof TransactionalRpcs>(
  fn: K,
  args: TransactionalRpcs[K]['args']
): Promise<TransactionalRpcs[K]['returns']> {
  const client = createClient() as unknown as RpcClient;
  const { data, error } = await client.rpc(fn, args as Record<string, unknown>);
  if (error) throw new Error(error.message);
  return data as TransactionalRpcs[K]['returns'];
}
