import { supabase } from '@/src/lib/supabase';
import type { Task, TaskStatus, TaskPriority } from '@/src/types/models';
import { ok, err, type Result } from '@/src/types/api';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  search?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  assigned_to?: string | null;
  assigned_by?: string | null;
  due_date?: string | null;
  source?: Task['source'];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  assigned_to?: string | null;
  due_date?: string | null;
  status?: TaskStatus;
  tags?: string[];
}

export const tasksService = {
  async list(orgId: string, filters?: TaskFilters): Promise<Result<Task[]>> {
    let query = supabase
      .from('tasks')
      .select('*, assigned_to_user:users!assigned_to(id, full_name, avatar_url)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) return err(error.message);
    return ok(data as Task[]);
  },

  async getById(id: string): Promise<Result<Task>> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, assigned_to_user:users!assigned_to(id, full_name, avatar_url)')
      .eq('id', id)
      .single();
    if (error) return err(error.message);
    return ok(data as Task);
  },

  async create(orgId: string, input: CreateTaskInput): Promise<Result<Task>> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        organization_id: orgId,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? 'medium',
        assigned_to: input.assigned_to ?? null,
        assigned_by: input.assigned_by ?? null,
        due_date: input.due_date ?? null,
        source: input.source ?? 'manual',
        status: 'todo' as TaskStatus,
      })
      .select('*, assigned_to_user:users!assigned_to(id, full_name, avatar_url)')
      .single();
    if (error) return err(error.message);
    return ok(data as Task);
  },

  async update(id: string, input: UpdateTaskInput): Promise<Result<Task>> {
    const { data, error } = await supabase
      .from('tasks')
      .update(input)
      .eq('id', id)
      .select('*, assigned_to_user:users!assigned_to(id, full_name, avatar_url)')
      .single();
    if (error) return err(error.message);
    return ok(data as Task);
  },

  async delete(id: string): Promise<Result<void>> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) return err(error.message);
    return ok(undefined);
  },

  async assign(id: string, userId: string): Promise<Result<Task>> {
    return tasksService.update(id, { assigned_to: userId });
  },

  async updateStatus(id: string, status: TaskStatus): Promise<Result<Task>> {
    const update: UpdateTaskInput = { status };
    if (status === 'done') {
      (update as Record<string, unknown>).completed_at = new Date().toISOString();
    }
    return tasksService.update(id, update);
  },
};
