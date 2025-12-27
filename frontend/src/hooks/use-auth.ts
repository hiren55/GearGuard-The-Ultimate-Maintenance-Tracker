'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore, useUser, useUserRole, useIsAuthenticated } from '@/stores/auth-store';
import type { User, UserRole } from '@/types';

// Global initialization state (shared across all component instances)
let authInitPromise: Promise<void> | null = null;
let authInitialized = false;

// Initialize auth globally (only once)
async function initializeAuth() {
  if (authInitialized || authInitPromise) {
    return authInitPromise;
  }

  const store = useAuthStore.getState();

  authInitPromise = (async () => {
    try {
      console.log('[Auth] Starting initialization...');
      const supabase = getSupabaseClient();

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Auth initialization timeout')), 10000);
      });

      // Get current session with timeout
      const sessionPromise = supabase.auth.getSession();
      const { data: { session }, error: sessionError } = await Promise.race([
        sessionPromise,
        timeoutPromise,
      ]) as Awaited<typeof sessionPromise>;

      if (sessionError) {
        console.error('[Auth] Session error:', sessionError);
        store.setError(sessionError.message);
        return;
      }

      if (session?.user) {
        console.log('[Auth] Session found, fetching profile...');
        store.setAuthUser(session.user);

        // Try to fetch user profile with timeout
        try {
          const profilePromise = supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const { data: profile, error: profileError } = await Promise.race([
            profilePromise,
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
            }),
          ]) as Awaited<typeof profilePromise>;

          if (profileError) {
            console.warn('[Auth] Profile fetch error:', profileError.message);
            // Create a basic user object from auth data
            const basicUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              phone: null,
              avatar_url: null,
              role: 'requester',
              department_id: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            store.setUser(basicUser);
          } else {
            console.log('[Auth] Profile loaded successfully');
            store.setUser(profile as User);
          }
        } catch (profileError) {
          console.warn('[Auth] Profile fetch failed:', profileError);
          // Create basic user from auth data
          const basicUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            phone: null,
            avatar_url: null,
            role: 'requester',
            department_id: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          store.setUser(basicUser);
        }
      } else {
        console.log('[Auth] No session found');
      }
    } catch (error) {
      console.error('[Auth] Initialization error:', error);
      store.setError(error instanceof Error ? error.message : 'Authentication error');
    } finally {
      console.log('[Auth] Initialization complete');
      authInitialized = true;
      store.setLoading(false);
      store.setInitialized(true);
    }
  })();

  return authInitPromise;
}

export function useAuth() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const { setAuthUser, setUser, setLoading, setInitialized, setError, reset } = useAuthStore();
  const user = useUser();
  const role = useUserRole();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthStore((state) => state.isLoading);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  // Initialize auth on first mount
  useEffect(() => {
    // Start initialization (global, only runs once)
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State change:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          setAuthUser(session.user);

          // Fetch user profile
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser(profile as User);
          } else {
            console.warn('[Auth] No profile found after sign in:', profileError);
            const basicUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              phone: null,
              avatar_url: null,
              role: 'requester',
              department_id: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setUser(basicUser);
          }
        } catch (error) {
          console.error('[Auth] Error during sign in handling:', error);
        } finally {
          setLoading(false);
          setInitialized(true);
        }
      } else if (event === 'SIGNED_OUT') {
        reset();
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[Auth] Token refreshed');
      } else if (event === 'INITIAL_SESSION') {
        // Initial session event - auth is being initialized
        // The initializeAuth function handles this
        console.log('[Auth] Initial session event');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setError(message);
      setLoading(false);
      return { success: false, error: message };
    }
  }, [supabase, setLoading, setError]);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [supabase, setLoading, setError]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      reset();
      router.push('/login');
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      setError(error instanceof Error ? error.message : 'Sign out failed');
    } finally {
      setLoading(false);
    }
  }, [supabase, router, reset, setLoading, setError]);

  // Request password reset
  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [supabase, setLoading, setError]);

  // Update password
  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password update failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [supabase, setLoading, setError]);

  // Check if user has minimum required role
  const hasRole = useCallback((minimumRole: UserRole): boolean => {
    if (!role) return false;

    const roleHierarchy: Record<UserRole, number> = {
      admin: 5,
      manager: 4,
      team_leader: 3,
      technician: 2,
      requester: 1,
    };

    return roleHierarchy[role] >= roleHierarchy[minimumRole];
  }, [role]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    if (!role) return false;
    return roles.includes(role);
  }, [role]);

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    isInitialized,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    hasRole,
    hasAnyRole,
  };
}

// Hook to require authentication
export function useRequireAuth(redirectTo: string = '/login') {
  const router = useRouter();
  const { isAuthenticated, isLoading, isInitialized } = useAuth();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isInitialized, router, redirectTo]);

  return { isAuthenticated, isLoading, isInitialized };
}

// Hook to require specific role
export function useRequireRole(minimumRole: UserRole, redirectTo: string = '/dashboard') {
  const router = useRouter();
  const { isAuthenticated, isLoading, isInitialized, hasRole } = useAuth();

  useEffect(() => {
    if (isInitialized && isAuthenticated && !hasRole(minimumRole)) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isInitialized, hasRole, minimumRole, router, redirectTo]);

  return { isAuthorized: hasRole(minimumRole), isLoading, isInitialized };
}
