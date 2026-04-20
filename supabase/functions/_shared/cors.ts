/**
 * Shared CORS headers for all edge functions.
 * Centralised to prevent divergence across functions.
 */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  // `x-app-version` carries the frontend Git SHA on every invoke so edge Sentry
  // events + log lines can tag `frontend_release` without an extra DB lookup.
  // See `src/lib/invoke-edge.ts` (sender) and `_shared/with-request-logging.ts` (reader).
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cid, x-app-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Standard CORS preflight response */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

/** Build a JSON response with CORS headers */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Build an error JSON response with CORS headers */
export function errorResponse(message: string, status = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
