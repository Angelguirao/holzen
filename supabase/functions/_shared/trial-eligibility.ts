import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type Stripe from "https://esm.sh/stripe@18.5.0";

/** Top disposable domains — lightweight backstop; extend as abuse patterns appear. */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "grr.la",
  "tempmail.com",
  "temp-mail.org",
  "throwaway.email",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "sharklasers.com",
  "dispostable.com",
  "maildrop.cc",
  "10minutemail.com",
  "fakeinbox.com",
  "mailnesia.com",
]);

export type TrialDenyReason =
  | "trial_already_used"
  | "email_not_verified"
  | "disposable_email"
  | "checkout_required";

export const TRIAL_PERIOD_DAYS = 7;

/** Normalize inbox identity so Gmail +alias and dot variants collide. */
export function normalizeEmailForTrialFingerprint(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return trimmed;

  let local = trimmed.slice(0, at);
  let domain = trimmed.slice(at + 1);
  if (domain === "googlemail.com") domain = "gmail.com";

  if (domain === "gmail.com") {
    const plus = local.indexOf("+");
    if (plus >= 0) local = local.slice(0, plus);
    local = local.replace(/\./g, "");
  }

  return `${local}@${domain}`;
}

export async function computeEmailFingerprint(email: string): Promise<string> {
  const normalized = normalizeEmailForTrialFingerprint(email);
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isDisposableEmailDomain(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@").pop();
  return domain != null && DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

export function isEmailVerified(user: {
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
}): boolean {
  return Boolean(user.email_confirmed_at ?? user.confirmed_at);
}

/** Any prior Stripe subscription on the customer means the trial offer was consumed. */
export function customerHasPriorSubscriptionHistory(
  subscriptions: Stripe.Subscription[],
): boolean {
  return subscriptions.length > 0;
}

export async function loadTrialUsedAt(
  svcClient: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await svcClient
    .from("profiles")
    .select("trial_used_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  const raw = data?.trial_used_at;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

export async function findFingerprintOwner(
  svcClient: SupabaseClient,
  fingerprint: string,
): Promise<string | null> {
  const { data, error } = await svcClient
    .from("trial_email_fingerprints")
    .select("user_id")
    .eq("email_fingerprint", fingerprint)
    .maybeSingle();
  if (error) throw error;
  const id = data?.user_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export async function findPaymentMethodFingerprintOwner(
  svcClient: SupabaseClient,
  fingerprint: string,
): Promise<string | null> {
  const { data, error } = await svcClient
    .from("trial_payment_method_fingerprints")
    .select("user_id")
    .eq("payment_method_fingerprint", fingerprint)
    .maybeSingle();
  if (error) throw error;
  const id = data?.user_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export async function markPaymentMethodFingerprint(
  svcClient: SupabaseClient,
  userId: string,
  fingerprint: string,
): Promise<void> {
  const { error } = await svcClient
    .from("trial_payment_method_fingerprints")
    .upsert(
      { payment_method_fingerprint: fingerprint, user_id: userId },
      { onConflict: "payment_method_fingerprint", ignoreDuplicates: true },
    );
  if (error) throw error;
}

/** Idempotent: records trial consumption for this user + normalized email fingerprint. */
export async function markTrialConsumed(
  svcClient: SupabaseClient,
  userId: string,
  email: string,
): Promise<void> {
  const now = new Date().toISOString();
  const fingerprint = await computeEmailFingerprint(email);

  const { error: profileError } = await svcClient
    .from("profiles")
    .update({ trial_used_at: now })
    .eq("user_id", userId)
    .is("trial_used_at", null);
  if (profileError) throw profileError;

  const { error: fpError } = await svcClient
    .from("trial_email_fingerprints")
    .upsert(
      { email_fingerprint: fingerprint, user_id: userId },
      { onConflict: "email_fingerprint", ignoreDuplicates: true },
    );
  if (fpError) throw fpError;
}

export async function assertTrialEligible(args: {
  svcClient: SupabaseClient;
  userId: string;
  email: string;
  stripeSubscriptions: Stripe.Subscription[];
}): Promise<{ eligible: true } | { eligible: false; reason: TrialDenyReason }> {
  if (isDisposableEmailDomain(args.email)) {
    return { eligible: false, reason: "disposable_email" };
  }

  const fingerprint = await computeEmailFingerprint(args.email);
  const fingerprintOwner = await findFingerprintOwner(args.svcClient, fingerprint);
  if (fingerprintOwner && fingerprintOwner !== args.userId) {
    return { eligible: false, reason: "trial_already_used" };
  }

  const trialUsedAt = await loadTrialUsedAt(args.svcClient, args.userId);
  if (trialUsedAt) {
    return { eligible: false, reason: "trial_already_used" };
  }

  if (customerHasPriorSubscriptionHistory(args.stripeSubscriptions)) {
    await markTrialConsumed(args.svcClient, args.userId, args.email);
    return { eligible: false, reason: "trial_already_used" };
  }

  return { eligible: true };
}
