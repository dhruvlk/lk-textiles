import { createClient } from '@/lib/supabase/client';
import type { DashboardStats, Inquiry } from '@/types';
import { getChallans } from './challans.service';

const supabase = () => createClient();

export async function getDashboardStats(companyId: string): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const [customersRes, challansRes, todayRes, monthlyRes, inquiriesCountRes, recentInquiriesRes] = await Promise.all([
    supabase()
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase()
      .from('challans')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase()
      .from('challans')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('date', today),
    supabase()
      .from('challans')
      .select('grand_total')
      .eq('company_id', companyId)
      .gte('date', monthStartStr),
    supabase()
      .from('inquiries')
      .select('id', { count: 'exact', head: true }),
    supabase()
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (customersRes.error) throw customersRes.error;
  if (challansRes.error) throw challansRes.error;
  if (todayRes.error) throw todayRes.error;
  if (monthlyRes.error) throw monthlyRes.error;

  const monthlySales = (monthlyRes.data ?? []).reduce(
    (sum, row) => sum + Number(row.grand_total ?? 0),
    0
  );

  const recentChallans = (await getChallans(companyId)).slice(0, 5);

  let totalInquiries = 0;
  let recentInquiries: Inquiry[] = [];

  if (!inquiriesCountRes.error && inquiriesCountRes.count !== null) {
    totalInquiries = inquiriesCountRes.count;
  }
  if (!recentInquiriesRes.error && recentInquiriesRes.data) {
    recentInquiries = recentInquiriesRes.data.map((row) => ({
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      subject: row.subject,
      message: row.message,
      status: row.status as 'new' | 'read',
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  return {
    totalCustomers: customersRes.count ?? 0,
    totalChallans: challansRes.count ?? 0,
    todayChallans: todayRes.count ?? 0,
    monthlySales,
    recentChallans,
    totalInquiries,
    recentInquiries,
  };
}

