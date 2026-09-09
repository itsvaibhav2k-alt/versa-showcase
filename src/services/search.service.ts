import { supabase } from '@/src/lib/supabase';
import { ok, err, type Result } from '@/src/types/api';

export interface SearchResults {
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
  callLogs: Array<{
    id: string;
    caller_name: string | null;
    caller_phone: string;
    status: string;
    summary: string | null;
  }>;
  emails: Array<{
    id: string;
    subject: string;
    from_address: string;
    classification: string | null;
  }>;
  teamMembers: Array<{
    id: string;
    user: { full_name: string } | null;
    title: string | null;
  }>;
}

export const searchService = {
  async search(orgId: string, query: string): Promise<Result<SearchResults>> {
    const pattern = `%${query}%`;

    const [tasksRes, callsRes, emailsRes, teamRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, status, priority')
        .eq('organization_id', orgId)
        .ilike('title', pattern)
        .order('created_at', { ascending: false })
        .limit(10),

      supabase
        .from('call_logs')
        .select('id, caller_name, caller_phone, status, summary')
        .eq('organization_id', orgId)
        .or(`caller_name.ilike.${pattern},caller_phone.ilike.${pattern}`)
        .order('started_at', { ascending: false })
        .limit(10),

      supabase
        .from('emails')
        .select('id, subject, from_address, classification')
        .eq('organization_id', orgId)
        .ilike('subject', pattern)
        .order('received_at', { ascending: false })
        .limit(10),

      supabase
        .from('team_members')
        .select('id, title, user:users!team_members_user_id_fkey(full_name)')
        .eq('organization_id', orgId)
        .eq('is_active', true),
    ]);

    if (tasksRes.error) return err(tasksRes.error.message);
    if (callsRes.error) return err(callsRes.error.message);
    if (emailsRes.error) return err(emailsRes.error.message);
    if (teamRes.error) return err(teamRes.error.message);

    // Filter team members client-side since we need to match on joined user.full_name
    const lowerQuery = query.toLowerCase();
    const filteredTeam = (teamRes.data ?? [])
      .filter((m: Record<string, unknown>) => {
        const user = m.user as { full_name: string } | null;
        return user?.full_name?.toLowerCase().includes(lowerQuery);
      })
      .slice(0, 10)
      .map((m: Record<string, unknown>) => ({
        id: m.id as string,
        user: m.user as { full_name: string } | null,
        title: m.title as string | null,
      }));

    return ok({
      tasks: tasksRes.data ?? [],
      callLogs: callsRes.data ?? [],
      emails: emailsRes.data ?? [],
      teamMembers: filteredTeam,
    });
  },
};
