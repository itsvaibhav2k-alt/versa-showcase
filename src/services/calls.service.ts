import { supabase, invokeWithTimeout } from '@/src/lib/supabase';
import type { CallLog, CallDirection, CallStatus } from '@/src/types/models';
import { ok, err, type Result } from '@/src/types/api';

export interface CreateCallLogInput {
  caller_name?: string | null;
  caller_phone: string;
  direction: CallDirection;
  status?: CallStatus;
  duration_seconds?: number;
  started_at: string;
  ended_at?: string | null;
  summary?: string | null;
  user_id: string;
}

export const callsService = {
  async list(orgId: string): Promise<Result<CallLog[]>> {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('started_at', { ascending: false });
    if (error) return err(error.message);
    return ok(data as CallLog[]);
  },

  async getById(id: string): Promise<Result<CallLog>> {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return err(error.message);
    return ok(data as CallLog);
  },

  async getByRetellId(retellId: string): Promise<Result<CallLog>> {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('retell_call_id', retellId)
      .single();
    if (error) return err(error.message);
    return ok(data as CallLog);
  },

  async create(orgId: string, input: CreateCallLogInput): Promise<Result<CallLog>> {
    const { data, error } = await supabase
      .from('call_logs')
      .insert({
        organization_id: orgId,
        user_id: input.user_id,
        caller_name: input.caller_name ?? null,
        caller_phone: input.caller_phone,
        direction: input.direction,
        status: input.status ?? 'completed',
        duration_seconds: input.duration_seconds ?? 0,
        started_at: input.started_at,
        ended_at: input.ended_at ?? null,
        summary: input.summary ?? null,
      })
      .select('*')
      .single();
    if (error) return err(error.message);
    return ok(data as CallLog);
  },

  async initiateCall(
    callLogId: string,
    toNumber: string,
    toName: string,
    purpose: string,
  ): Promise<Result<{ retell_call_id: string }>> {
    const { data, error } = await invokeWithTimeout('initiate-call', {
      body: { to_number: toNumber, to_name: toName, purpose, call_log_id: callLogId },
    });
    if (error) return err(error.message);
    if (data?.success === false) return err(data.error || 'Failed to initiate call');
    return ok({ retell_call_id: data?.retell_call_id });
  },
};
