import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/stores/auth-store';
import type { User, Organization } from '@/src/types/models';

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, fullName: string, orgName: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (authError) throw authError;

    if (authData.user) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: orgName.toLowerCase().replace(/\s+/g, '-'),
        })
        .select()
        .single();
      if (orgError) throw orgError;

      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          organization_id: org.id,
          email,
          full_name: fullName,
          role: 'owner',
        });
      if (userError) throw userError;
    }

    return authData;
  },

  async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'versa://reset-password',
    });
    if (error) throw error;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    useAuthStore.getState().reset();
  },

  async fetchUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data as User;
  },

  async fetchOrganization(orgId: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    if (error) return null;
    return data as Organization;
  },

  async initializeAuth() {
    const store = useAuthStore.getState();
    store.setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      store.setSession(session);

      if (session?.user) {
        const user = await authService.fetchUserProfile(session.user.id);
        if (!user) {
          await supabase.auth.signOut();
          store.reset();
          return;
        }
        store.setUser(user);

        if (user.organization_id) {
          const org = await authService.fetchOrganization(user.organization_id);
          store.setOrganization(org);
        }
      }
    } catch {
      // Network unreachable or Supabase down — reset to signed-out state
      store.reset();
    } finally {
      store.setLoading(false);
      store.setInitialized(true);
    }
  },
};
