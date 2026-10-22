import { createClient } from '@/lib/supabase/client';
import { callTransactionalRpc } from '@/lib/supabase/rpc';
import type { Challan, ChallanPayment } from '@/types';

const supabase = () => createClient();

function mapPayment(row: Record<string, unknown>): ChallanPayment {
  return row as unknown as ChallanPayment;
}

export async function getChallanPayments(challanId: string): Promise<ChallanPayment[]> {
  const { data, error } = await supabase()
    .from('challan_payments')
    .select('*')
    .eq('challan_id', challanId)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapPayment);
}

export interface RecordChallanPaymentInput {
  challanId: string;
  companyId: string;
  amount: number;
  paymentDate: string;
  paymentMode?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  userId?: string | null;
}

export async function recordChallanPayment(
  input: RecordChallanPaymentInput
): Promise<Challan> {
  const { getChallanById } = await import('@/services/challans.service');

  // The ledger row and the invoice's running total are updated in one locked
  // transaction (record_invoice_payment), so concurrent payments are never lost
  // and the balance check uses the current total.
  await callTransactionalRpc('record_invoice_payment', {
    p_invoice_id: input.challanId,
    p_amount: input.amount,
    p_payment_date: input.paymentDate || null,
    p_payment_mode: input.paymentMode ?? null,
    p_reference: input.referenceNumber ?? null,
    p_notes: input.notes ?? null,
  });

  const updated = await getChallanById(input.challanId);
  if (!updated) throw new Error('Failed to load updated challan');
  return updated;
}
