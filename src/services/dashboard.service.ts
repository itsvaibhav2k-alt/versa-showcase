import { supabase } from '@/src/lib/supabase';
import { ok, err, type Result } from '@/src/types/api';
import type { DashboardStats } from '@/src/types/models';

export const dashboardService = {
  async getStats(userId: string): Promise<Result<DashboardStats>> {
    const { data, error } = await supabase
      .from('dashboard_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) return err(error.message);
    return ok(data as DashboardStats);
  },
};
