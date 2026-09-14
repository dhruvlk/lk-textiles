import { createClient } from '@/lib/supabase/client';
import { isValidIndianMobile, formatPhoneToStorage } from '@/lib/validations/phone';
import type { RegisterCompanyInput } from '@/types/auth';

const supabase = () => createClient();

type AuthRpcClient = {
  rpc(
    fn: 'register_company_account',
    args: {
      p_company_name: string;
      p_owner_name: string;
      p_mobile: string;
      p_gst_number?: string | null;
      p_address?: string | null;
    }
  ): PromiseLike<{ data: string | null; error: { message: string } | null }>;
  rpc(
    fn: 'provision_pending_company_account'
  ): PromiseLike<{ data: string | null; error: { message: string } | null }>;
};

export async function registerCompanyAccount(input: RegisterCompanyInput) {
  if (!isValidIndianMobile(input.mobile, { required: true })) {
    throw new Error('Mobile number must be a valid 10-digit number prefixed with +91');
  }
  const mobile = formatPhoneToStorage(input.mobile)!;
  const client = supabase();

  const { data: authData, error: signUpError } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.ownerName,
        owner_name: input.ownerName,
        mobile,
        role: 'Owner',
        company_name: input.companyName,
        gst_number: input.gstNumber ?? null,
        company_address: input.address ?? null,
      },
    },
  });

  if (signUpError) throw signUpError;
  if (!authData.user) throw new Error('Registration failed');

  if (!authData.session) {
    return { requiresConfirmation: true as const };
  }

  const { error: provisionError } = await (client as unknown as AuthRpcClient).rpc(
    'register_company_account',
    {
      p_company_name: input.companyName,
      p_owner_name: input.ownerName,
      p_mobile: mobile,
      p_gst_number: input.gstNumber ?? null,
      p_address: input.address ?? null,
    }
  );

  if (provisionError) throw provisionError;

  return { requiresConfirmation: false as const };
}

export async function provisionPendingCompanyAccount(): Promise<string | null> {
  const { data, error } = await (supabase() as unknown as AuthRpcClient).rpc(
    'provision_pending_company_account'
  );
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  await provisionPendingCompanyAccount();
}

export async function requestPasswordReset(email: string) {
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/reset-password`
      : undefined;

  const { error } = await supabase().auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase().auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase().auth.signOut();
  if (error) throw error;
}

// Future-ready: phone OTP sign-in can plug in here without changing callers.
export async function signInWithPhoneOtp(_mobile: string) {
  throw new Error('Phone OTP authentication is not enabled yet.');
}
