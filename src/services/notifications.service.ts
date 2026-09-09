import { supabase } from '@/src/lib/supabase';
import type { Notification } from '@/src/types/models';
import { ok, err, type Result } from '@/src/types/api';

export const notificationsService = {
  async list(userId: string): Promise<Result<Notification[]>> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return err(error.message);
    return ok(data as Notification[]);
  },

  async getUnreadCount(userId: string): Promise<Result<number>> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) return err(error.message);
    return ok(count ?? 0);
  },

  async markRead(id: string): Promise<Result<void>> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return err(error.message);
    return ok(undefined);
  },

  async markAllRead(userId: string): Promise<Result<void>> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) return err(error.message);
    return ok(undefined);
  },
};
