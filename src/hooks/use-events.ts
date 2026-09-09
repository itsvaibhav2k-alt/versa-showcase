import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsService, type CreateEventInput, type UpdateEventInput } from '@/src/services/events.service';
import { useAuth } from '@/src/hooks/use-auth';
import { QUERY_KEYS } from '@/src/lib/constants';

export function useEvents(start: string, end: string) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEYS.events, orgId, start, end],
    queryFn: async () => {
      const result = await eventsService.listByDateRange(orgId!, start, end);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!orgId && !!start && !!end,
  });
}

export function useTodayEvents() {
  const { orgId, userId } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEYS.todayEvents, orgId, userId],
    queryFn: async () => {
      const result = await eventsService.getToday(orgId!, userId!);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!orgId && !!userId,
  });
}

export function useEventsForDate(date: Date | null) {
  const { orgId } = useAuth();
  const dateKey = date ? date.toISOString().split('T')[0] : null;
  return useQuery({
    queryKey: [QUERY_KEYS.events, 'day', orgId, dateKey],
    queryFn: async () => {
      const d = date!;
      const startOfDay = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
      ).toISOString();
      const endOfDay = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        23, 59, 59, 999,
      ).toISOString();
      const result = await eventsService.listByDateRange(orgId!, startOfDay, endOfDay);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!orgId && !!date && !!dateKey,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { orgId, userId } = useAuth();
  return useMutation({
    mutationFn: async (data: CreateEventInput) => {
      const result = await eventsService.create(orgId!, userId!, data);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.events] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.todayEvents] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEventInput }) => {
      const result = await eventsService.update(id, data);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.events] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.todayEvents] });
    },
  });
}
