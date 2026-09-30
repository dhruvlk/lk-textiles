"use client"

import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, AuthContextType, RegisterCompanyInput, RegisterUserInput } from '@/types/auth';
import { createClient } from '@/lib/supabase/client';
import { buildAppUser } from '@/lib/user-session';
import { getProfile } from '@/services/profiles.service';
import {
  getInactiveAccountMessage,
  getPrimaryMembership,
} from '@/services/company-members.service';
import {
  provisionPendingCompanyAccount,
  registerCompanyAccount,
  requestPasswordReset,
  signInWithEmail,
  signOut,
  updatePassword,
} from '@/services/auth.service';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function usersEqual(a: User | null, b: User | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.email === b.email &&
    a.name === b.name &&
    a.mobile === b.mobile &&
    a.role === b.role &&
    a.companyId === b.companyId &&
    a.avatarUrl === b.avatarUrl
  );
}

/** Auth events that require a full profile/membership re-hydrate. */
const HYDRATE_EVENTS = new Set([
  'SIGNED_IN',
  'SIGNED_OUT',
  'USER_UPDATED',
  'PASSWORD_RECOVERY',
]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const userRef = useRef<User | null>(null);

  const setUserStable = useCallback((next: User | null) => {
    if (usersEqual(userRef.current, next)) return;
    userRef.current = next;
    setUser(next);
  }, []);

  const hydrateUser = useCallback(async (authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  }) => {
    const inactiveMessage = await getInactiveAccountMessage(authUser.id);
    if (inactiveMessage) {
      await signOut();
      return null;
    }
    let [profile, membership] = await Promise.all([
      getProfile(authUser.id),
      getPrimaryMembership(authUser.id),
    ]);

    if (!membership && authUser.user_metadata?.company_name) {
      await provisionPendingCompanyAccount();
      membership = await getPrimaryMembership(authUser.id);
    }

    return buildAppUser(authUser, profile, membership);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setUserStable(null);
      setIsAuthenticated(false);
      return;
    }
    const appUser = await hydrateUser(authUser);
    if (!appUser) {
      setUserStable(null);
      setIsAuthenticated(false);
      return;
    }
    setUserStable(appUser);
    setIsAuthenticated(true);
  }, [hydrateUser, setUserStable, supabase]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser && mounted) {
        const appUser = await hydrateUser(authUser);
        if (appUser) {
          setUserStable(appUser);
          setIsAuthenticated(true);
        } else {
          setUserStable(null);
          setIsAuthenticated(false);
        }
      }
      if (mounted) setIsLoading(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // TOKEN_REFRESHED / INITIAL_SESSION fire on tab focus and must NOT
        // re-hydrate profile/membership or remount the tree.
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          return;
        }

        if (!HYDRATE_EVENTS.has(event) && session?.user) {
          // Ignore unknown non-critical events while a session exists.
          return;
        }

        if (session?.user) {
          const appUser = await hydrateUser(session.user);
          if (!mounted) return;
          if (appUser) {
            setUserStable(appUser);
            setIsAuthenticated(true);
          } else {
            setUserStable(null);
            setIsAuthenticated(false);
          }
        } else {
          if (!mounted) return;
          setUserStable(null);
          setIsAuthenticated(false);
        }
        if (mounted) setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUser, setUserStable, supabase]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const inactiveMessage = await getInactiveAccountMessage(authUser.id);
        if (inactiveMessage) {
          await signOut();
          setUserStable(null);
          setIsAuthenticated(false);
          return { error: inactiveMessage };
        }
      }
      await refreshUser();
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Login failed' };
    }
  }, [refreshUser, setUserStable, supabase]);

  const register = useCallback(async (input: RegisterUserInput | RegisterCompanyInput) => {
    try {
      const result = await registerCompanyAccount(input);
      if (!result.requiresConfirmation) {
        await refreshUser();
      }
      return { requiresConfirmation: result.requiresConfirmation };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Registration failed' };
    }
  }, [refreshUser]);

  const handleRequestPasswordReset = useCallback(async (email: string) => {
    try {
      await requestPasswordReset(email);
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to send reset email' };
    }
  }, []);

  const handleUpdatePassword = useCallback(async (password: string) => {
    try {
      await updatePassword(password);
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update password' };
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUserStable(null);
    setIsAuthenticated(false);
  }, [setUserStable]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      requestPasswordReset: handleRequestPasswordReset,
      updatePassword: handleUpdatePassword,
      logout,
      refreshUser,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      handleRequestPasswordReset,
      handleUpdatePassword,
      logout,
      refreshUser,
    ]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
