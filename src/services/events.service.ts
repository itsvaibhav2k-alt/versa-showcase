import { supabase } from '@/src/lib/supabase';
import type { CalendarEvent } from '@/src/types/models';
import { ok, err, type Result } from '@/src/types/api';

export interface CreateEventInput {
  title: string;
  description?: string | null;
  location?: string | null;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  attendees?: CalendarEvent['attendees'];
}

export interface UpdateEventInput {
  title?: string;
  description?: string | null;
  location?: string | null;
  start_time?: string;
  end_time?: string;
  is_all_day?: boolean;
  attendees?: CalendarEvent['attendees'];
}

export const eventsService = {
  async listByDateRange(
    orgId: string,
    start: string,
    end: string,
  ): Promise<Result<CalendarEvent[]>> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('organization_id', orgId)
      .gte('start_time', start)
      .lte('start_time', end)
      .order('start_time', { ascending: true });
    if (error) return err(error.message);
    return ok(data as CalendarEvent[]);
  },

  async getToday(orgId: string, userId: string): Promise<Result<CalendarEvent[]>> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23, 59, 59, 999,
    ).toISOString();

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .order('start_time', { ascending: true });
    if (error) return err(error.message);
    return ok(data as CalendarEvent[]);
  },

  async create(orgId: string, userId: string, input: CreateEventInput): Promise<Result<CalendarEvent>> {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        organization_id: orgId,
        user_id: userId,
        title: input.title,
        description: input.description ?? null,
        location: input.location ?? null,
        start_time: input.start_time,
        end_time: input.end_time,
        is_all_day: input.is_all_day ?? false,
        attendees: input.attendees ?? [],
      })
      .select()
      .single();
    if (error) return err(error.message);
    return ok(data as CalendarEvent);
  },

  async update(id: string, input: UpdateEventInput): Promise<Result<CalendarEvent>> {
    const { data, error } = await supabase
      .from('calendar_events')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) return err(error.message);
    return ok(data as CalendarEvent);
  },
};
