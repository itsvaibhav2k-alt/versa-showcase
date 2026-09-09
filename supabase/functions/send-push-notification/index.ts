import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsPreflightIfNeeded, jsonResponse } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

interface PushRequest {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Send a push notification to a user via Expo Push API.
 *
 * This function is called internally by other edge functions (e.g., retell-webhook)
 * or via database triggers. It does NOT require user JWT — it uses the service role key
 * to look up the user's push token.
 *
 * To restrict access, this function checks for a shared internal secret
 * in the x-internal-secret header.
 */
serve(async (req: Request) => {
  const corsResponse = handleCorsPreflightIfNeeded(req);
  if (corsResponse) return corsResponse;

  // Internal functions can call this with a shared secret
  const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET') || '';
  const providedSecret = req.headers.get('x-internal-secret') || '';
  const authHeader = req.headers.get('Authorization') || '';

  // Allow if: valid service role key OR matching internal secret
  const hasServiceRole = authHeader.includes(SUPABASE_SERVICE_ROLE_KEY);
  const hasInternalSecret = internalSecret && providedSecret === internalSecret;

  if (!hasServiceRole && !hasInternalSecret) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, req, 401);
  }

  try {
    const { user_id, title, body, data }: PushRequest = await req.json();

    if (!user_id || !title) {
      return jsonResponse(
        { success: false, error: 'user_id and title are required' },
        req,
        400,
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Look up the user's push token
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('expo_push_token')
      .eq('id', user_id)
      .single();

    if (fetchError || !user?.expo_push_token) {
      return jsonResponse(
        { success: false, error: 'User has no push token registered' },
        req,
        404,
      );
    }

    // Send via Expo Push API
    const pushResponse = await fetch(EXPO_PUSH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: user.expo_push_token,
        title,
        body,
        data: data || {},
        sound: 'default',
        badge: 1,
      }),
    });

    const pushResult = await pushResponse.json();

    if (!pushResponse.ok) {
      return jsonResponse(
        { success: false, error: 'Expo Push API error', details: pushResult },
        req,
        502,
      );
    }

    return jsonResponse({ success: true, ticket: pushResult.data }, req);
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: 'Failed to send push notification',
        details: String(error),
      },
      req,
      500,
    );
  }
});
