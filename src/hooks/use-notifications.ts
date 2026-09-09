import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/src/services/notifications.service';
import { useAuth } from '@/src/hooks/use-auth';
import { QUERY_KEYS } from '@/src/lib/constants';

export function useNotifications() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEYS.notifications, userId],
    queryFn: async () => {
      const result = await notificationsService.list(userId!);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!userId,
  });
}

export function useUnreadCount() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEYS.unreadCount, userId],
    queryFn: async () => {
      const result = await notificationsService.getUnreadCount(userId!);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!userId,
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await notificationsService.markRead(id);
      if (!result.isOk) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.unreadCount] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const result = await notificationsService.markAllRead(userId!);
      if (!result.isOk) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.unreadCount] });
    },
  });
}
