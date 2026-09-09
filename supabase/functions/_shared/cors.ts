/**
 * Shared CORS helper for Supabase Edge Functions.
 *
 * In production, set the ALLOWED_ORIGINS env var to restrict origins.
 * Example: "https://yourdomain.com,https://app.yourdomain.com"
 * Falls back to '*' only in local development.
 */

const ALLOWED_ORIGINS_RAW = Deno.env.get('ALLOWED_ORIGINS') || '*';
const ALLOWED_ORIGINS = ALLOWED_ORIGINS_RAW === '*'
  ? null
  : ALLOWED_ORIGINS_RAW.split(',').map((o) => o.trim());

export function getCorsOrigin(req: Request): string {
  if (!ALLOWED_ORIGINS) return '*';
  const origin = req.headers.get('Origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

export function corsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

export function handleCorsPreflightIfNeeded(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }
  return null;
}

export function jsonResponse(
  body: Record<string, unknown>,
  req: Request,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(req),
    },
  });
}
