import { useCallback, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/use-auth';
import { integrationsService } from '@/src/services/integrations.service';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/lib/constants';
import { showToast } from '@/src/components/ui/toast-config';

// TODO: Set these in your .env file
// EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export function useGoogleCalendarAuth() {
  const { userId, orgId } = useAuth();
  const queryClient = useQueryClient();

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'versa',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      redirectUri,
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery,
  );

  const exchangeCodeForTokens = useCallback(
    async (code: string) => {
      try {
        const { data, error } = await supabase.functions.invoke(
          'google-calendar-token-exchange',
          {
            body: {
              code,
              redirect_uri: redirectUri,
              code_verifier: request?.codeVerifier,
            },
          },
        );

        if (error) throw error;

        if (userId && orgId) {
          await integrationsService.upsert(userId, orgId, 'google_calendar', {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            email: data.email,
          });
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.integrations] });
          showToast('success', 'Connected', 'Google Calendar linked');
        }
      } catch {
        showToast('error', 'OAuth Failed', 'Could not connect Google Calendar');
      }
    },
    [userId, orgId, redirectUri, request, queryClient],
  );

  useEffect(() => {
    if (response?.type === 'success' && response.params.code) {
      exchangeCodeForTokens(response.params.code);
    }
  }, [response, exchangeCodeForTokens]);

  const connect = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      showToast('info', 'Not Configured', 'Google Calendar credentials not set');
      return;
    }
    promptAsync();
  }, [promptAsync]);

  return {
    connect,
    isReady: !!request,
  };
}
