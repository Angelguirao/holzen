/** Public waitlist + landing view edge calls (no auth). */

import type { LandingAttribution } from "./landing-attribution";

function supabaseFunctionsBase(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url || typeof url !== "string") return null;
  return `${url.replace(/\/$/, "")}/functions/v1`;
}

function anonKey(): string | null {
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return typeof key === "string" && key.length > 0 ? key : null;
}

function edgeHeaders(): Record<string, string> | null {
  const key = anonKey();
  if (!key) return null;
  return {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

export function waitlistConfigured(): boolean {
  return Boolean(supabaseFunctionsBase() && anonKey());
}

export async function pingLandingView(path = "/"): Promise<void> {
  const base = supabaseFunctionsBase();
  const headers = edgeHeaders();
  if (!base || !headers) return;
  try {
    await fetch(`${base}/landing-ping`, {
      method: "POST",
      headers,
      body: JSON.stringify({ path }),
      keepalive: true,
    });
  } catch {
    /* best-effort */
  }
}

export async function submitWaitlistEmail(
  email: string,
  options?: {
    source?: string;
    ref?: string | null;
    attribution?: LandingAttribution | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = supabaseFunctionsBase();
  const headers = edgeHeaders();
  if (!base || !headers) {
    return { ok: false, error: "Waitlist is not configured yet." };
  }
  const attr = options?.attribution;
  try {
    const res = await fetch(`${base}/waitlist-signup`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        source: options?.source ?? "welcome",
        ref: options?.ref ?? attr?.ref ?? undefined,
        utm_source: attr?.utm_source ?? undefined,
        utm_medium: attr?.utm_medium ?? undefined,
        utm_campaign: attr?.utm_campaign ?? undefined,
        utm_content: attr?.utm_content ?? undefined,
        utm_term: attr?.utm_term ?? undefined,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string | { message?: string };
    };
    if (!res.ok) {
      const err = typeof data.error === "string" ? data.error : data.error?.message;
      return { ok: false, error: err ?? "Could not join waitlist." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error — try again." };
  }
}
