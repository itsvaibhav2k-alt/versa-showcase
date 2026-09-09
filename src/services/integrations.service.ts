import { supabase, invokeWithTimeout } from '@/src/lib/supabase';
import { ok, err, type Result } from '@/src/types/api';

export interface Integration {
  id: string;
  user_id: string;
  organization_id: string;
  provider: 'google_calendar' | 'outlook_calendar';
  account_email: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
}

export const integrationsService = {
  async list(userId: string): Promise<Result<Integration[]>> {
    const { data, error } = await supabase
      .from('integrations')
      .select('id, user_id, organization_id, provider, account_email, is_active, last_synced_at, created_at')
      .eq('user_id', userId)
      .eq('is_active', true);
    if (error) return err(error.message);
    return ok(data as Integration[]);
  },

  async upsert(
    userId: string,
    orgId: string,
    provider: Integration['provider'],
    tokens: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      email: string;
    },
  ): Promise<Result<Integration>> {
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const { data, error } = await supabase
      .from('integrations')
      .upsert(
        {
          user_id: userId,
          organization_id: orgId,
          provider,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt,
          account_email: tokens.email,
          is_active: true,
          scope: 'calendar.readonly,userinfo.email',
        },
        { onConflict: 'user_id,provider' },
      )
      .select('id, user_id, organization_id, provider, account_email, is_active, last_synced_at, created_at')
      .single();
    if (error) return err(error.message);
    return ok(data as Integration);
  },

  async disconnect(userId: string, provider: string): Promise<Result<void>> {
    const { error } = await supabase
      .from('integrations')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('provider', provider);
    if (error) return err(error.message);
    return ok(undefined);
  },

  async triggerSync(integrationId: string): Promise<Result<{ synced_count: number }>> {
    const { data, error } = await invokeWithTimeout('sync-google-calendar', {
      body: { integration_id: integrationId },
    });
    if (error) return err(error.message);
    return ok(data as { synced_count: number });
  },
};
