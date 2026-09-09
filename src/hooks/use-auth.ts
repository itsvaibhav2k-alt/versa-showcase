import { useAuthStore } from '@/src/stores/auth-store';

export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const organization = useAuthStore((s) => s.organization);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  return {
    session,
    user,
    organization,
    isLoading,
    isInitialized,
    isAuthenticated: !!session && !!user,
    userId: user?.id ?? null,
    orgId: organization?.id ?? user?.organization_id ?? null,
  };
}
