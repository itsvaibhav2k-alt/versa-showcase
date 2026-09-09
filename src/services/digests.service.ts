import { supabase, invokeWithTimeout } from '@/src/lib/supabase';
import type { Digest } from '@/src/types/models';
import { ok, err, type Result } from '@/src/types/api';

export const digestsService = {
  async getLatest(userId: string): Promise<Result<Digest | null>> {
    const { data, error } = await supabase
      .from('digests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return err(error.message);
    return ok(data as Digest | null);
  },

  async getByDate(userId: string, date: string): Promise<Result<Digest | null>> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('digests')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })
      .maybeSingle();
    if (error) return err(error.message);
    return ok(data as Digest | null);
  },

  async markRead(id: string): Promise<Result<void>> {
    const { error } = await supabase
      .from('digests')
      .update({ is_read: true })
      .eq('id', id);
    if (error) return err(error.message);
    return ok(undefined);
  },

  async generateBriefing(userId: string, organizationId: string): Promise<Result<Digest>> {
    const { data, error } = await invokeWithTimeout('generate-briefing', {
      body: {
        user_id: userId,
        organization_id: organizationId,
        digest_type: 'morning',
      },
    });
    if (error) return err(error.message);
    if (data?.success === false) return err(data.error || 'Failed to generate briefing');
    return ok(data?.digest as Digest);
  },
};
