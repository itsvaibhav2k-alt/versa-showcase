import { useQuery } from '@tanstack/react-query';
import { callsService } from '@/src/services/calls.service';
import { useAuth } from '@/src/hooks/use-auth';
import { QUERY_KEYS } from '@/src/lib/constants';

export function useCallLogs() {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEYS.callLogs, orgId],
    queryFn: async () => {
      const result = await callsService.list(orgId!);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!orgId,
  });
}

export function useCallLog(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.callLogs, id],
    queryFn: async () => {
      const result = await callsService.getById(id);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!id,
  });
}
