import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sentEmailsService,
  type CreateDraftInput,
  type UpdateDraftInput,
} from '@/src/services/sent-emails.service';
import { useAuth } from '@/src/hooks/use-auth';
import { QUERY_KEYS } from '@/src/lib/constants';

export function useSentEmails(status?: string) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEYS.sentEmails, orgId, status],
    queryFn: async () => {
      const result = await sentEmailsService.listSent(orgId!, status);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!orgId,
  });
}

export function useSentEmail(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.sentEmails, id],
    queryFn: async () => {
      const result = await sentEmailsService.getById(id);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!id,
  });
}

export function useCreateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateDraftInput) => {
      const result = await sentEmailsService.createDraft(data);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sentEmails] });
    },
  });
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDraftInput }) => {
      const result = await sentEmailsService.updateDraft(id, data);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sentEmails] });
    },
  });
}

export function useMarkSending() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await sentEmailsService.markSending(id);
      if (!result.isOk) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sentEmails] });
    },
  });
}

export function useMarkSent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await sentEmailsService.markSent(id);
      if (!result.isOk) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sentEmails] });
    },
  });
}

export function useMarkFailed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await sentEmailsService.markFailed(id);
      if (!result.isOk) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sentEmails] });
    },
  });
}
