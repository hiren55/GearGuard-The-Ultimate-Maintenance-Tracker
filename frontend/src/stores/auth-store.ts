import { create } from 'zustand';
import type { User as AuthUser } from '@supabase/supabase-js';
import type { User, UserRole } from '@/types';

interface AuthState {
  // Auth user from Supabase
  authUser: AuthUser | null;
  // User profile from our users table
  user: User | null;
  // Loading state
  isLoading: boolean;
  // Whether auth has been initialized
  isInitialized: boolean;
  // Error state
  error: string | null;

  // Actions
  setAuthUser: (authUser: AuthUser | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setInitialized: (isInitialized: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  authUser: null,
  user: null,
  isLoading: true,
  isInitialized: false,
  error: null,
};

export const useAuthStore = create<AuthState>()((set) => ({
  ...initialState,

  setAuthUser: (authUser) => set({ authUser }),

  setUser: (user) => set({ user }),

  setLoading: (isLoading) => set({ isLoading }),

  setInitialized: (isInitialized) => set({ isInitialized }),

  setError: (error) => set({ error }),

  reset: () => set({ ...initialState, isLoading: false, isInitialized: true }),
}));

// Selector hooks for convenience
export const useUser = () => useAuthStore((state) => state.user);
export const useAuthUser = () => useAuthStore((state) => state.authUser);
export const useUserRole = (): UserRole | null => useAuthStore((state) => state.user?.role ?? null);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.authUser);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useIsInitialized = () => useAuthStore((state) => state.isInitialized);
