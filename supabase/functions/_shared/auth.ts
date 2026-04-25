/**
 * Shared auth helpers for edge functions.
 * Provides consistent JWT verification and service role validation.
 */

import type { User } from "https://esm.sh/@supabase/supabase-js@2.57.2";

/** Create a Supabase client with the user's auth header */
export async function createAuthenticatedClient(authHeader: string) {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.57.2");
  const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const sbAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  return createClient(sbUrl, sbAnon, {
    global: { headers: { Authorization: authHeader } },
  });
}

/** Create a Supabase service role client (for server-side operations) */
export async function createServiceClient() {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.57.2");
  const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(sbUrl, svcKey, { auth: { persistSession: false } });
}

/**
 * Verify user JWT from the Authorization header.
 * Returns the authenticated user or null.
 */
export async function verifyUserAuth(req: Request): Promise<{ user: User; authHeader: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const client = await createAuthenticatedClient(authHeader);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;

  return { user, authHeader };
}

/**
 * Verify service role JWT or CRON_SECRET in `Authorization: Bearer …`.
 * Do not rely on `x-supabase-cron` here — Edge function URLs are public; that header is trivially spoofable.
 */
export function verifyServiceAuth(req: Request): boolean {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";

  if (token === serviceRoleKey) return true;
  if (cronSecret.length > 0 && token === cronSecret) return true;

  return false;
}

/**
 * Flexible auth that supports both user JWT and service role key.
 * Used by functions that can be called from both client and server.
 * Returns userId (from JWT or request body) or null.
 */
export async function verifyFlexAuth(req: Request, bodyUserId?: string): Promise<{ userId: string | null; isService: boolean }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { userId: null, isService: false };

  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // Service role key → server-to-server call
  if (token === serviceRoleKey) {
    return { userId: bodyUserId || null, isService: true };
  }

  // Otherwise try user JWT
  const client = await createAuthenticatedClient(authHeader);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return { userId: null, isService: false };

  return { userId: user.id, isService: false };
}
