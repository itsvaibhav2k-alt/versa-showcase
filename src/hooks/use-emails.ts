import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailsService } from '@/src/services/emails.service';
import { useAuth } from '@/src/hooks/use-auth';
import { QUERY_KEYS } from '@/src/lib/constants';

export function useEmails() {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEYS.emails, orgId],
    queryFn: async () => {
      const result = await emailsService.listInbound(orgId!);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!orgId,
  });
}

export function useEmail(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.emails, id],
    queryFn: async () => {
      const result = await emailsService.getById(id);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!id,
  });
}

export function useMarkEmailRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await emailsService.markRead(id);
      if (!result.isOk) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.emails] });
    },
  });
}

export function useArchiveEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await emailsService.archive(id);
      if (!result.isOk) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.emails] });
    },
  });
}
