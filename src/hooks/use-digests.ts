import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { digestsService } from '@/src/services/digests.service';
import { useAuth } from '@/src/hooks/use-auth';
import { QUERY_KEYS } from '@/src/lib/constants';

export function useLatestDigest() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEYS.digests, 'latest', userId],
    queryFn: async () => {
      const result = await digestsService.getLatest(userId!);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!userId,
  });
}

export function useTodayDigest() {
  const { userId } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: [QUERY_KEYS.digests, 'today', userId, today],
    queryFn: async () => {
      const result = await digestsService.getByDate(userId!, today);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!userId,
    staleTime: 30 * 60 * 1000,
  });
}

export function useMarkDigestRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await digestsService.markRead(id);
      if (!result.isOk) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.digests] });
    },
  });
}
