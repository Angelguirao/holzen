/**
 * Pause bounded-context adapter for PostHog product analytics (Tier 1 lib shim).
 * Ritual/application telemetry modules import from here — not `@/lib/posthog` directly.
 */
export { trackEvent } from '@/lib/posthog';
