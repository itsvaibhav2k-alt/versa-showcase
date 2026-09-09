import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService, type CreateMemberInput } from '@/src/services/team.service';
import { useAuth } from '@/src/hooks/use-auth';
import { QUERY_KEYS } from '@/src/lib/constants';

export function useTeamMembers() {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEYS.teamMembers, orgId],
    queryFn: async () => {
      const result = await teamService.listMembers(orgId!);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!orgId,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  const { orgId } = useAuth();
  return useMutation({
    mutationFn: async (data: CreateMemberInput) => {
      const result = await teamService.createMember(orgId!, data);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.teamMembers] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await teamService.removeMember(id);
      if (!result.isOk) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.teamMembers] });
    },
  });
}
