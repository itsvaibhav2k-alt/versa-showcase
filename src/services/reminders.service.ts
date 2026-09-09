import { supabase } from '@/src/lib/supabase';
import type { Reminder } from '@/src/types/models';
import { ok, err, type Result } from '@/src/types/api';

export interface CreateReminderInput {
  title: string;
  body?: string | null;
  remind_at: string;
  source?: Reminder['source'];
  source_id?: string | null;
  recurrence_rule?: string | null;
}

export const remindersService = {
  async list(orgId: string, userId: string): Promise<Result<Reminder[]>> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .order('remind_at', { ascending: true });
    if (error) return err(error.message);
    return ok(data as Reminder[]);
  },

  async create(
    orgId: string,
    userId: string,
    input: CreateReminderInput,
  ): Promise<Result<Reminder>> {
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        organization_id: orgId,
        user_id: userId,
        title: input.title,
        body: input.body ?? null,
        remind_at: input.remind_at,
        source: input.source ?? 'manual',
        source_id: input.source_id ?? null,
        recurrence_rule: input.recurrence_rule ?? null,
      })
      .select('*')
      .single();
    if (error) return err(error.message);
    return ok(data as Reminder);
  },

  async update(
    id: string,
    input: Partial<CreateReminderInput>,
  ): Promise<Result<Reminder>> {
    const { data, error } = await supabase
      .from('reminders')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();
    if (error) return err(error.message);
    return ok(data as Reminder);
  },

  async delete(id: string): Promise<Result<void>> {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);
    if (error) return err(error.message);
    return ok(undefined);
  },
};
