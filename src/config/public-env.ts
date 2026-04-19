/**
 * Public build-time configuration for the browser bundle.
 *
 * Every value in this file is inlined into the JavaScript that ships to users.
 * That is intentional: these are *public* keys by vendor design (Sentry DSN,
 * PostHog write-scoped project key, etc.). Security comes from origin
 * restriction on the vendor side — never from hiding the keys.
 *
 * Rule of thumb:
 *   - If a vendor calls their key `publishable`, `public`, `anon`, `write-only`,
 *     or "project API key" — it belongs here.
 *   - If a vendor calls their key `secret`, `service-role`, `server`, or private —
 *     it belongs in Lovable Secrets and is read by edge functions only.
 *
 * Resolution order at build time:
 *   1. Vite statically replaces `import.meta.env.VITE_*` with whatever is in the
 *      current env (set via `.env`, `.env.local`, CI, etc.).
 *   2. When the env var is unset, we fall back to the `FALLBACK_*` constants.
 *   3. Empty string → the corresponding feature is a no-op at runtime (see
 *      `initSentry` / `initPostHog`).
 *
 * To enable observability in the hosted (Lovable) build: paste your Sentry DSN
 * and PostHog project key into the `FALLBACK_*` constants below, commit, push.
 * Rotate values the same way. Lovable's Secrets UI correctly refuses `VITE_*`
 * names because Vite would immediately ship them to every browser, and the
 * vault's promise of secrecy would be false.
 *
 * DO NOT put anything genuinely private in this file (Stripe secret keys,
 * Anthropic API keys, service-role tokens, Slack webhook URLs, etc.). Those
 * belong in Lovable Secrets and are read only by Deno edge functions. See
 * `docs/ops/observability-setup.md` for the full map.
 */

// ────────── Fallbacks (committed) ──────────
//
// These ship to every browser. Restrict origins on the vendor side:
//   - Sentry → Settings → Projects → <project> → Security & Privacy → Allowed Domains
//   - PostHog → Project Settings → Authorized URLs
// Without those, the public key works but anyone could spam your quota.

const FALLBACK_SENTRY_DSN = "https://058e67096a0444d05214743e2d0d6ee6@o4511246392688640.ingest.de.sentry.io/4511247675621456";
const FALLBACK_POSTHOG_KEY = "phc_vZNSHh3QAtqbYQagwyFmfRFFt6YKpSB7jrUWSH4qpQRy";
const FALLBACK_POSTHOG_HOST = "https://eu.i.posthog.com";

// ────────── Resolved exports (read these everywhere else) ──────────

/** Sentry DSN for the frontend project. Empty → Sentry init is a no-op. */
export const SENTRY_DSN: string =
  import.meta.env.VITE_SENTRY_DSN || FALLBACK_SENTRY_DSN;

/** PostHog project API key (write-scoped, domain-restricted). Empty → PostHog init is a no-op. */
export const POSTHOG_KEY: string =
  import.meta.env.VITE_POSTHOG_KEY || FALLBACK_POSTHOG_KEY;

/** PostHog ingest host. EU cloud (GDPR). */
export const POSTHOG_HOST: string =
  import.meta.env.VITE_POSTHOG_HOST || FALLBACK_POSTHOG_HOST;
