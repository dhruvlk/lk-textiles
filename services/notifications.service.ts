import { fetchAllRows } from '@/lib/supabase/fetch-all';
import { todayISODate } from '@/lib/dates';
import { createClient } from '@/lib/supabase/client';
import { isPastDue, resolvePaymentStatus } from '@/lib/payment-status';
import { STOCK_LOW_THRESHOLD } from '@/types';
import type { AppNotification, NotificationType } from '@/types';
import type { NotificationRow } from '@/types/database';

const supabase = () => createClient();

/** Prevent hammering Supabase when multiple components mount or re-render. */
const SYNC_COOLDOWN_MS = 5 * 60 * 1000;
const lastPaymentSyncAt = new Map<string, number>();
const inFlightPaymentSync = new Map<string, Promise<void>>();

function mapNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    company_id: row.company_id,
    user_id: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    is_read: row.is_read,
    created_at: row.created_at,
  };
}

export async function getNotifications(
  companyId: string,
  limit = 30
): Promise<AppNotification[]> {
  const { data, error } = await supabase()
    .from('notifications')
    .select(
      'id, company_id, user_id, type, title, message, entity_type, entity_id, is_read, created_at'
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapNotification);
}

export async function getUnreadNotificationCount(companyId: string): Promise<number> {
  const { count, error } = await supabase()
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('is_read', false);

  if (error) throw error;
  return count ?? 0;
}

export async function createNotification(input: {
  companyId: string;
  type: NotificationType;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  userId?: string | null;
}): Promise<AppNotification | null> {
  if (input.entityId && input.entityType) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase()
      .from('notifications')
      .select('id')
      .eq('company_id', input.companyId)
      .eq('type', input.type)
      .eq('entity_type', input.entityType)
      .eq('entity_id', input.entityId)
      .gte('created_at', since)
      .limit(1);

    if (existing?.length) return null;
  }

  const { data, error } = await supabase()
    .from('notifications')
    .insert({
      company_id: input.companyId,
      user_id: input.userId ?? null,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      is_read: false,
    })
    .select()
    .single();

  if (error) throw error;
  return mapNotification(data);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase()
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(companyId: string): Promise<void> {
  const { error } = await supabase()
    .from('notifications')
    .update({ is_read: true })
    .eq('company_id', companyId)
    .eq('is_read', false);
  if (error) throw error;
}

export async function clearNotification(id: string): Promise<void> {
  const { error } = await supabase().from('notifications').delete().eq('id', id);
  if (error) throw error;
}

export async function clearAllNotifications(companyId: string): Promise<void> {
  const { error } = await supabase()
    .from('notifications')
    .delete()
    .eq('company_id', companyId);
  if (error) throw error;
}

/**
 * Create due/overdue payment notifications for open invoices.
 * Scoped to invoices due today or earlier; batched to avoid N+1 requests.
 */
export async function syncPaymentDueNotifications(
  companyId: string,
  options: { force?: boolean } = {}
): Promise<void> {
  const now = Date.now();
  const last = lastPaymentSyncAt.get(companyId) ?? 0;
  if (!options.force && now - last < SYNC_COOLDOWN_MS) {
    return;
  }

  const inFlight = inFlightPaymentSync.get(companyId);
  if (inFlight && !options.force) {
    return inFlight;
  }

  const run = async () => {
    const today = todayISODate();

    const { data, error } = await fetchAllRows(() => supabase()
      .from('challans')
      .select('id, challan_number, due_date, grand_total, payment_amount_received, payment_status')
      .eq('company_id', companyId)
      .neq('payment_status', 'Paid')
      .not('due_date', 'is', null)
      .lte('due_date', today).order('id'));

    if (error || !data?.length) {
      lastPaymentSyncAt.set(companyId, Date.now());
      return;
    }

    const candidates: Array<{
      id: string;
      challan_number: string;
      type: 'overdue_payment' | 'payment_due';
      title: string;
      message: string;
    }> = [];

    for (const row of data) {
      const status = resolvePaymentStatus({
        grand_total: Number(row.grand_total ?? 0),
        payment_amount_received: Number(row.payment_amount_received ?? 0),
        due_date: row.due_date,
      });

      if (status === 'Paid') continue;

      if (status === 'Overdue' || isPastDue(row.due_date)) {
        candidates.push({
          id: row.id,
          challan_number: row.challan_number,
          type: 'overdue_payment',
          title: 'Overdue payment',
          message: `Invoice ${row.challan_number} is overdue.`,
        });
      } else if (row.due_date === today) {
        candidates.push({
          id: row.id,
          challan_number: row.challan_number,
          type: 'payment_due',
          title: 'Payment due today',
          message: `Invoice ${row.challan_number} is due today.`,
        });
      }
    }

    if (!candidates.length) {
      lastPaymentSyncAt.set(companyId, Date.now());
      return;
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const entityIds = candidates.map((row) => row.id);

    const { data: existing } = await supabase()
      .from('notifications')
      .select('entity_id, type')
      .eq('company_id', companyId)
      .eq('entity_type', 'challan')
      .in('entity_id', entityIds)
      .gte('created_at', since);

    const existingKeys = new Set(
      (existing ?? []).map((row) => `${row.type}:${row.entity_id}`)
    );

    const inserts = candidates
      .filter((row) => !existingKeys.has(`${row.type}:${row.id}`))
      .map((row) => ({
        company_id: companyId,
        user_id: null,
        type: row.type,
        title: row.title,
        message: row.message,
        entity_type: 'challan',
        entity_id: row.id,
        is_read: false,
      }));

    if (inserts.length) {
      const { error: insertError } = await supabase().from('notifications').insert(inserts);
      if (insertError) throw insertError;
    }

    lastPaymentSyncAt.set(companyId, Date.now());
  };

  const promise = run().finally(() => {
    if (inFlightPaymentSync.get(companyId) === promise) {
      inFlightPaymentSync.delete(companyId);
    }
  });

  inFlightPaymentSync.set(companyId, promise);
  return promise;
}

export async function notifyStockStatus(input: {
  companyId: string;
  stockId: string;
  quality: string;
  availableTaka: number;
}): Promise<void> {
  if (input.availableTaka <= 0) {
    await createNotification({
      companyId: input.companyId,
      type: 'out_of_stock',
      title: 'Out of stock',
      message: `${input.quality} is out of stock.`,
      entityType: 'stock',
      entityId: input.stockId,
    }).catch(() => undefined);
    return;
  }

  if (input.availableTaka <= STOCK_LOW_THRESHOLD) {
    await createNotification({
      companyId: input.companyId,
      type: 'low_stock',
      title: 'Low stock',
      message: `${input.quality} is low (${input.availableTaka} available).`,
      entityType: 'stock',
      entityId: input.stockId,
    }).catch(() => undefined);
  }
}
