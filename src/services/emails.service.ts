import { supabase } from '@/src/lib/supabase';
import type { Email } from '@/src/types/models';
import { ok, err, type Result } from '@/src/types/api';

export const emailsService = {
  async listInbound(orgId: string): Promise<Result<Email[]>> {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_archived', false)
      .order('received_at', { ascending: false });
    if (error) return err(error.message);
    return ok(data as Email[]);
  },

  async getById(id: string): Promise<Result<Email>> {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return err(error.message);
    return ok(data as Email);
  },

  async markRead(id: string): Promise<Result<void>> {
    const { error } = await supabase
      .from('emails')
      .update({ is_read: true })
      .eq('id', id);
    if (error) return err(error.message);
    return ok(undefined);
  },

  async archive(id: string): Promise<Result<void>> {
    const { error } = await supabase
      .from('emails')
      .update({ is_archived: true })
      .eq('id', id);
    if (error) return err(error.message);
    return ok(undefined);
  },
};
