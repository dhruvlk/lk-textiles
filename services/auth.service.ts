import { createClient } from '@/lib/supabase/client';
import { isValidIndianMobile, formatPhoneToStorage } from '@/lib/validations/phone';
import { setSelectedCompanyId, addCompany } from '@/services/companies.service';
import { getResetPasswordRedirectUrl } from '@/lib/auth-url';
import type { RegisterCompanyInput, RegisterUserInput } from '@/types/auth';

const supabase = () => createClient();

export async function registerUserAccount(input: RegisterUserInput) {
  const mobile =
    input.mobile && isValidIndianMobile(input.mobile)
      ? formatPhoneToStorage(input.mobile)
      : null;
  const client = supabase();

  const { data: authData, error: signUpError } = await client.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        name: input.fullName.trim(),
        full_name: input.fullName.trim(),
        company_name: input.companyName.trim(),
        mobile,
        role: 'Owner',
      },
    },
  });

  if (signUpError) throw signUpError;
  if (!authData.user) throw new Error('Registration failed');

  if (!authData.session) {
    return { requiresConfirmation: true as const };
  }

  // Create User Profile + Primary Company + Owner Membership + Sequence
  try {
    const { data: rpcCompanyId, error: rpcError } = await client.rpc(
      'register_company_account',
      {
        p_company_name: input.companyName.trim(),
        p_owner_name: input.fullName.trim(),
        p_mobile: mobile || '',
      }
    );

    let activeCompanyId = (rpcCompanyId as string) || null;

    if (rpcError || !activeCompanyId) {
      await client.from('profiles').upsert({
        id: authData.user.id,
        full_name: input.fullName.trim(),
        mobile,
      });

      const newCompany = await addCompany({
        user_id: authData.user.id,
        name: input.companyName.trim(),
        email: input.email.trim(),
        phone: mobile,
        is_active: true,
        is_primary: true,
      });

      if (newCompany?.id) {
        activeCompanyId = newCompany.id;
        await client
          .from('challan_sequences')
          .insert({
            company_id: newCompany.id,
            last_number: 0,
            updated_at: new Date().toISOString(),
          })
          .select();
      }
    }

    if (activeCompanyId) {
      await setSelectedCompanyId(activeCompanyId);
    }
  } catch (err) {
    console.error('Error creating primary company during registration:', err);
  }

  return { requiresConfirmation: false as const };
}

export async function registerCompanyAccount(input: RegisterCompanyInput | RegisterUserInput) {
  const fullName =
    'fullName' in input && input.fullName
      ? input.fullName
      : 'ownerName' in input && input.ownerName
      ? input.ownerName
      : 'User';

  return registerUserAccount({
    fullName,
    companyName: input.companyName,
    email: input.email,
    mobile: input.mobile,
    password: input.password,
  });
}

export async function provisionPendingCompanyAccount(): Promise<string | null> {
  const client = supabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  try {
    const { data, error } = await client.rpc('provision_pending_company_account');
    if (error) {
      console.warn('provision_pending_company_account error:', error.message);
      return null;
    }
    const companyId = data as string;
    if (companyId) {
      await setSelectedCompanyId(companyId);
    }
    return companyId || null;
  } catch (err) {
    console.warn('provisionPendingCompanyAccount error:', err);
    return null;
  }
}


export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  const redirectTo = getResetPasswordRedirectUrl();

  const { error } = await supabase().auth.resetPasswordForEmail(cleanEmail, {
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
