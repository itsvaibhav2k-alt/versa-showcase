import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService, type TaskFilters, type CreateTaskInput, type UpdateTaskInput } from '@/src/services/tasks.service';
import { useAuth } from '@/src/hooks/use-auth';
import { QUERY_KEYS } from '@/src/lib/constants';
import type { TaskStatus } from '@/src/types/models';

export function useTasks(filters?: TaskFilters) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEYS.tasks, orgId, filters],
    queryFn: async () => {
      const result = await tasksService.list(orgId!, filters);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!orgId,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.tasks, id],
    queryFn: async () => {
      const result = await tasksService.getById(id);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { orgId } = useAuth();
  return useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      const result = await tasksService.create(orgId!, data);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskInput }) => {
      const result = await tasksService.update(id, data);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await tasksService.delete(id);
      if (!result.isOk) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const result = await tasksService.assign(id, userId);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const result = await tasksService.updateStatus(id, status);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
    },
  });
}
