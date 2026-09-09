import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/use-auth';

export function useRealtimeSubscription(table: string, queryKey: string[]) {
  const queryClient = useQueryClient();
  const { orgId } = useAuth();

  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel(`${table}-changes-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, orgId, queryClient, queryKey]);
}
