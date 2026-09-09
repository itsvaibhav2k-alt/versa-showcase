import { supabase } from '@/src/lib/supabase';
import type { TeamMember } from '@/src/types/models';
import { ok, err, type Result } from '@/src/types/api';

export interface CreateMemberInput {
  user_id: string;
  title?: string | null;
  department?: string | null;
}

export interface UpdateMemberInput {
  title?: string | null;
  department?: string | null;
  skills?: string[];
  is_active?: boolean;
}

export const teamService = {
  async listMembers(orgId: string): Promise<Result<TeamMember[]>> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*, user:users!team_members_user_id_fkey(*)')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error) return err(error.message);
    return ok(data as TeamMember[]);
  },

  async getMember(id: string): Promise<Result<TeamMember>> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*, user:users!team_members_user_id_fkey(*)')
      .eq('id', id)
      .single();
    if (error) return err(error.message);
    return ok(data as TeamMember);
  },

  async createMember(orgId: string, input: CreateMemberInput): Promise<Result<TeamMember>> {
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        organization_id: orgId,
        user_id: input.user_id,
        title: input.title ?? null,
        department: input.department ?? null,
      })
      .select('*, user:users!team_members_user_id_fkey(*)')
      .single();
    if (error) return err(error.message);
    return ok(data as TeamMember);
  },

  async updateMember(id: string, input: UpdateMemberInput): Promise<Result<TeamMember>> {
    const { data, error } = await supabase
      .from('team_members')
      .update(input)
      .eq('id', id)
      .select('*, user:users!team_members_user_id_fkey(*)')
      .single();
    if (error) return err(error.message);
    return ok(data as TeamMember);
  },

  async removeMember(id: string): Promise<Result<void>> {
    const { error } = await supabase
      .from('team_members')
      .update({ is_active: false })
      .eq('id', id);
    if (error) return err(error.message);
    return ok(undefined);
  },
};
