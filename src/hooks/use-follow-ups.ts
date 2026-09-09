import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followUpsService } from '@/src/services/follow-ups.service';
import type { CreateTaskInput } from '@/src/services/tasks.service';
import { useAuth } from '@/src/hooks/use-auth';
import { QUERY_KEYS } from '@/src/lib/constants';

export function useFollowUps() {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEYS.followUps, orgId],
    queryFn: async () => {
      const result = await followUpsService.list(orgId!);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!orgId,
  });
}

export function useFollowUpsByCall(callId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.followUps, 'call', callId],
    queryFn: async () => {
      const result = await followUpsService.listByCall(callId);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!callId,
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await followUpsService.complete(id);
      if (!result.isOk) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.followUps] });
    },
  });
}

export function useDismissFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await followUpsService.dismiss(id);
      if (!result.isOk) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.followUps] });
    },
  });
}

export function useConvertFollowUpToTask() {
  const queryClient = useQueryClient();
  const { orgId } = useAuth();
  return useMutation({
    mutationFn: async ({ id, taskData }: { id: string; taskData: CreateTaskInput }) => {
      const result = await followUpsService.convertToTask(id, orgId!, taskData);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.followUps] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
    },
  });
}
