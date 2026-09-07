import { createClient } from '@/lib/supabase/client';
import type { Inquiry, InquiryFilters, InquiryStatus } from '@/types';
import type { InquiryRow } from '@/types/database';

const supabase = () => createClient();

function mapInquiry(row: InquiryRow): Inquiry {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    subject: row.subject,
    message: row.message,
    status: row.status as InquiryStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getInquiries(filters?: InquiryFilters): Promise<Inquiry[]> {
  let query = supabase()
    .from('inquiries')
    .select('*');

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    query = query.or(
      `full_name.ilike.${q},email.ilike.${q},phone.ilike.${q},company.ilike.${q},subject.ilike.${q},message.ilike.${q}`
    );
  }

  if (filters?.sort?.column) {
    query = query.order(filters.sort.column as keyof InquiryRow, {
      ascending: filters.sort.direction === 'asc',
    });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching inquiries:', error);
    throw error;
  }

  return (data ?? []).map(mapInquiry);
}

export async function getInquiriesCount(): Promise<{ total: number; unread: number }> {
  try {
    const [totalRes, unreadRes] = await Promise.all([
      supabase().from('inquiries').select('id', { count: 'exact', head: true }),
      supabase().from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    ]);

    return {
      total: totalRes.count ?? 0,
      unread: unreadRes.count ?? 0,
    };
  } catch (error) {
    console.error('Error fetching inquiries count:', error);
    return { total: 0, unread: 0 };
  }
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<Inquiry> {
  const { data, error } = await supabase()
    .from('inquiries')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating inquiry status:', error);
    throw error;
  }

  return mapInquiry(data);
}

export async function deleteInquiry(id: string): Promise<void> {
  const { error } = await supabase()
    .from('inquiries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting inquiry:', error);
    throw error;
  }
}
