import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/lib/constants';
import { integrationsService, type Integration } from '@/src/services/integrations.service';
import { useAuth } from '@/src/hooks/use-auth';
import { showToast } from '@/src/components/ui/toast-config';

export function useIntegrations() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEYS.integrations, userId],
    queryFn: async () => {
      if (!userId) return [];
      const result = await integrationsService.list(userId);
      return result.isOk ? result.value : [];
    },
    enabled: !!userId,
  });
}

export function useIntegration(provider: string): Integration | null {
  const { data: integrations } = useIntegrations();
  return integrations?.find((i) => i.provider === provider) ?? null;
}

export function useDisconnectIntegration() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: string) => {
      if (!userId) throw new Error('Not authenticated');
      const result = await integrationsService.disconnect(userId, provider);
      if (!result.isOk) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.integrations] });
      showToast('success', 'Disconnected', 'Integration removed');
    },
    onError: () => {
      showToast('error', 'Error', 'Could not disconnect integration');
    },
  });
}

export function useTriggerCalendarSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const result = await integrationsService.triggerSync(integrationId);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.events] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.todayEvents] });
      showToast('success', 'Synced', `${data.synced_count} events updated`);
    },
    onError: () => {
      showToast('error', 'Sync Failed', 'Could not sync calendar');
    },
  });
}
