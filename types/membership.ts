import type { UserRole } from '@/constants/auth';

export type ProfileRow = {
  id: string;
  full_name: string;
  mobile: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyMemberRow = {
  id: string;
  company_id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  is_primary?: boolean;
  designation: string | null;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
};

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  is_primary?: boolean;
  designation?: string | null;
  invited_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  mobile?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}
