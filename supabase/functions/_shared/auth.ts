/**
 * Shared auth helper for Supabase Edge Functions.
 *
 * Verifies the caller's JWT token by creating a Supabase client
 * scoped to the user's session and checking auth.getUser().
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

export interface AuthResult {
  userId: string;
  error: string | null;
}

/**
 * Verify the Authorization header and return the authenticated user's ID.
 * Returns { userId, error } — if error is non-null, the request should be rejected.
 */
export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: '', error: 'Missing or invalid Authorization header' };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { userId: '', error: error?.message || 'Invalid or expired token' };
  }

  return { userId: user.id, error: null };
}
