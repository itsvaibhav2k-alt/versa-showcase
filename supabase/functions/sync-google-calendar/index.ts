import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsPreflightIfNeeded, jsonResponse } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

interface SyncRequest {
  integration_id: string;
}

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  recurrence?: string[];
  attendees?: { email: string; displayName?: string; responseStatus?: string }[];
}

/**
 * Refresh the Google OAuth access token using the stored refresh_token.
 * Returns the new access_token or throws on failure.
 */
async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${errText}`);
  }

  return await response.json();
}

/**
 * Fetch upcoming events from Google Calendar API.
 * Gets events from now until 14 days ahead.
 */
async function fetchGoogleEvents(accessToken: string): Promise<GoogleEvent[]> {
  const now = new Date().toISOString();
  const twoWeeksLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin: now,
    timeMax: twoWeeksLater,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Calendar API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.items || [];
}

serve(async (req: Request) => {
  const corsResponse = handleCorsPreflightIfNeeded(req);
  if (corsResponse) return corsResponse;

  // Verify authentication
  const { userId: authUserId, error: authError } = await verifyAuth(req);
  if (authError) {
    return jsonResponse({ success: false, error: authError }, req, 401);
  }

  try {
    const { integration_id }: SyncRequest = await req.json();

    if (!integration_id) {
      return jsonResponse(
        { success: false, error: 'integration_id is required' },
        req,
        400,
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch integration record
    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('user_id', authUserId)
      .single();

    if (fetchError || !integration) {
      return jsonResponse(
        { success: false, error: 'Integration not found or access denied' },
        req,
        404,
      );
    }

    if (!integration.is_active) {
      return jsonResponse(
        { success: false, error: 'Integration is not active' },
        req,
        400,
      );
    }

    if (!integration.refresh_token) {
      return jsonResponse(
        { success: false, error: 'No refresh token stored — re-authenticate' },
        req,
        400,
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = integration.access_token;
    const tokenExpiresAt = integration.token_expires_at
      ? new Date(integration.token_expires_at)
      : null;

    if (!accessToken || !tokenExpiresAt || tokenExpiresAt <= new Date()) {
      // Token expired or missing — refresh it
      const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
      const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';

      if (!googleClientId || !googleClientSecret) {
        return jsonResponse(
          { success: false, error: 'Google OAuth credentials not configured on server' },
          req,
          500,
        );
      }

      const refreshed = await refreshAccessToken(
        integration.refresh_token,
        googleClientId,
        googleClientSecret,
      );

      accessToken = refreshed.access_token;

      // Update stored token
      await supabase
        .from('integrations')
        .update({
          access_token: refreshed.access_token,
          token_expires_at: new Date(
            Date.now() + refreshed.expires_in * 1000,
          ).toISOString(),
        })
        .eq('id', integration_id);
    }

    // Fetch events from Google Calendar
    const googleEvents = await fetchGoogleEvents(accessToken);

    // Upsert events into calendar_events table
    let syncedCount = 0;

    for (const event of googleEvents) {
      const isAllDay = !event.start.dateTime;
      const startTime = event.start.dateTime || `${event.start.date}T00:00:00Z`;
      const endTime = event.end.dateTime || `${event.end.date}T23:59:59Z`;

      const attendees = (event.attendees || []).map((a) => ({
        email: a.email,
        name: a.displayName || null,
        status: a.responseStatus || 'needsAction',
      }));

      const { error: upsertError } = await supabase
        .from('calendar_events')
        .upsert(
          {
            organization_id: integration.organization_id,
            user_id: integration.user_id,
            title: event.summary || '(No title)',
            description: event.description || null,
            location: event.location || null,
            start_time: startTime,
            end_time: endTime,
            is_all_day: isAllDay,
            recurrence_rule: event.recurrence ? event.recurrence[0] : null,
            external_id: event.id,
            external_source: 'google',
            attendees: JSON.stringify(attendees),
            metadata: {},
          },
          { onConflict: 'external_id' },
        );

      if (!upsertError) {
        syncedCount++;
      } else {
        console.error(`Failed to upsert event ${event.id}:`, upsertError);
      }
    }

    // Update last_synced_at on integration
    await supabase
      .from('integrations')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', integration_id);

    return jsonResponse({ synced_count: syncedCount }, req);
  } catch (error) {
    console.error('sync-google-calendar error:', error);
    return jsonResponse(
      {
        success: false,
        error: 'Failed to sync calendar. Please try again.',
        details: String(error),
      },
      req,
      500,
    );
  }
});
