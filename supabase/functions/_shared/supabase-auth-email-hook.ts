import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

export interface SupabaseAuthEmailHookPayload {
  user: {
    email: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

function normalizeHookSecret(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("v1,whsec_")) return trimmed.slice("v1,whsec_".length);
  return trimmed;
}

export function verifySupabaseAuthEmailHook(
  payload: string,
  headers: Headers,
): SupabaseAuthEmailHookPayload {
  const secret = Deno.env.get("SEND_EMAIL_HOOK_SECRET")?.trim();
  if (!secret) {
    throw new Error("SEND_EMAIL_HOOK_SECRET not configured");
  }

  const wh = new Webhook(normalizeHookSecret(secret));
  return wh.verify(payload, Object.fromEntries(headers)) as SupabaseAuthEmailHookPayload;
}

export function buildSupabaseConfirmationUrl(
  emailData: SupabaseAuthEmailHookPayload["email_data"],
): string {
  const siteUrl = (emailData.site_url || Deno.env.get("SUPABASE_URL") || "")
    .replace(/\/$/, "");
  const params = new URLSearchParams({
    token: emailData.token_hash,
    type: emailData.email_action_type,
    redirect_to: emailData.redirect_to,
  });
  return `${siteUrl}/auth/v1/verify?${params.toString()}`;
}

export function templatePropsFromSupabaseHook(
  payload: SupabaseAuthEmailHookPayload,
  siteName: string,
  rootDomain: string,
): Record<string, unknown> {
  const { user, email_data: emailData } = payload;
  return {
    siteName,
    siteUrl: emailData.site_url || `https://${rootDomain}`,
    recipient: user.email,
    confirmationUrl: buildSupabaseConfirmationUrl(emailData),
    token: emailData.token,
    email: user.email,
    newEmail: emailData.token_new ?? user.email,
  };
}
