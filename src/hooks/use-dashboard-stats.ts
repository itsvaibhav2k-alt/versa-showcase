import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/src/services/dashboard.service';
import { useAuth } from '@/src/hooks/use-auth';

export function useDashboardStats() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['dashboard-stats', userId],
    queryFn: async () => {
      const result = await dashboardService.getStats(userId!);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!userId,
  });
}
