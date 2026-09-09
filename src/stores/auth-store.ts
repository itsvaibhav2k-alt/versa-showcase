import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { User, Organization } from '@/src/types/models';

interface AuthState {
  session: Session | null;
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isInitialized: boolean;

  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  organization: null,
  isLoading: true,
  isInitialized: false,

  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setOrganization: (organization) => set({ organization }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  reset: () => set({
    session: null,
    user: null,
    organization: null,
    isLoading: false,
  }),
}));
