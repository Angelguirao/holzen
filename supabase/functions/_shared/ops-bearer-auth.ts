/** Bearer tokens allowed for ops-only edge endpoints (previews, internal tools). */
export function authorizeOpsBearer(authHeader: string | null): boolean {
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  const allowed = [
    Deno.env.get("CRON_SECRET"),
    Deno.env.get("EMAIL_PREVIEW_SECRET"),
    Deno.env.get("SEND_EMAIL_HOOK_SECRET"),
  ].filter((value): value is string => Boolean(value?.trim()));

  return allowed.some((secret) => secret === token);
}
