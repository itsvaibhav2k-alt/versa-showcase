import { supabase } from '@/src/lib/supabase';
import type { FollowUp, TaskStatus } from '@/src/types/models';
import type { CreateTaskInput } from '@/src/services/tasks.service';
import { ok, err, type Result } from '@/src/types/api';

export const followUpsService = {
  async list(orgId: string): Promise<Result<FollowUp[]>> {
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*, call_log:call_logs(id, caller_name, caller_phone, summary)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    if (error) return err(error.message);
    return ok(data as FollowUp[]);
  },

  async listByCall(callLogId: string): Promise<Result<FollowUp[]>> {
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*, call_log:call_logs(id, caller_name, caller_phone, summary)')
      .eq('call_log_id', callLogId)
      .order('created_at', { ascending: false });
    if (error) return err(error.message);
    return ok(data as FollowUp[]);
  },

  async complete(id: string): Promise<Result<void>> {
    const { error } = await supabase
      .from('follow_ups')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return err(error.message);
    return ok(undefined);
  },

  async dismiss(id: string): Promise<Result<void>> {
    const { error } = await supabase
      .from('follow_ups')
      .update({ status: 'dismissed' })
      .eq('id', id);
    if (error) return err(error.message);
    return ok(undefined);
  },

  async convertToTask(
    id: string,
    orgId: string,
    taskData: CreateTaskInput,
  ): Promise<Result<FollowUp>> {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        organization_id: orgId,
        title: taskData.title,
        description: taskData.description ?? null,
        priority: taskData.priority ?? 'medium',
        assigned_to: taskData.assigned_to ?? null,
        due_date: taskData.due_date ?? null,
        source: 'call_followup' as const,
        source_id: id,
        status: 'todo' as TaskStatus,
      })
      .select()
      .single();
    if (taskError) return err(taskError.message);

    const { data: followUp, error: followUpError } = await supabase
      .from('follow_ups')
      .update({ task_id: task.id, status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, call_log:call_logs(id, caller_name, caller_phone, summary)')
      .single();
    if (followUpError) return err(followUpError.message);
    return ok(followUp as FollowUp);
  },
};
