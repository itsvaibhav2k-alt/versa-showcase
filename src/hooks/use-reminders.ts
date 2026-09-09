import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remindersService, type CreateReminderInput } from '@/src/services/reminders.service';
import { useAuth } from '@/src/hooks/use-auth';
import { QUERY_KEYS } from '@/src/lib/constants';

export function useReminders() {
  const { orgId, userId } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEYS.reminders, orgId, userId],
    queryFn: async () => {
      if (!orgId || !userId) {
        throw new Error('Cannot list reminders: user is not authenticated');
      }
      const result = await remindersService.list(orgId, userId);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!orgId && !!userId,
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  const { orgId, userId } = useAuth();
  return useMutation({
    mutationFn: async (data: CreateReminderInput) => {
      if (!orgId || !userId) {
        throw new Error('Cannot create reminder: user is not authenticated');
      }
      const result = await remindersService.create(orgId, userId, data);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.reminders] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await remindersService.delete(id);
      if (!result.isOk) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.reminders] });
    },
  });
}
