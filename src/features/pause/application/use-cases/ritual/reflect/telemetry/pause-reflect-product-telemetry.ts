/**
 * Reflect telemetry cluster entry for PostHog (Tier 1 lib peel).
 * Forwards to the pause bounded-context adapter — not `@/lib/posthog` directly.
 */
export { trackEvent } from '@/features/pause/application/pause-product-analytics';
