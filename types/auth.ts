import { USER_ROLES, type UserRole } from '@/constants/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  mobile?: string | null;
  role: UserRole;
  companyId?: string | null;
  avatarUrl?: string | null;
}

export interface RegisterUserInput {
  fullName: string;
  companyName: string;
  email: string;
  mobile?: string;
  password: string;
}

export interface RegisterCompanyInput {
  companyName: string;
  ownerName?: string;
  fullName?: string;
  email: string;
  mobile?: string;
  gstNumber?: string;
  address?: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (input: RegisterUserInput | RegisterCompanyInput) => Promise<{
    error?: string;
    requiresConfirmation?: boolean;
  }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function isUserRole(value: string | undefined | null): value is UserRole {
  return !!value && (USER_ROLES as readonly string[]).includes(value);
}
