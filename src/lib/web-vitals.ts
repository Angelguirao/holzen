// Core Web Vitals → Sentry performance measurements.
//
// Sends CLS, INP, LCP, FCP, TTFB as Sentry measurements tagged with rating (good/needs-
// improvement/poor). No PII. Also mirrors to console in dev so designers can eyeball
// regressions locally. The same samples are also sent to PostHog as `performance.web_vital`.
//
// Implementation notes:
//   - `web-vitals` reports a final value per metric per page; we do not need to batch.
//   - We create a lightweight Sentry transaction per metric so it shows up in the
//     performance dashboard. Alternatively, we could use `Sentry.setMeasurement` within
//     a navigation transaction, but that couples us to Sentry's BrowserTracing integration
//     timing — this approach is more robust across Sentry SDK versions.

import type { Metric } from "web-vitals";
import { Sentry } from "./sentry";
import { trackEvent } from "./posthog";

function reportMetric(metric: Metric) {
  const { name, value, rating, id } = metric;
  const roundedValue = Math.round(metric.name === "CLS" ? value * 1000 : value);

  if (import.meta.env.DEV) {
    console.info(`[web-vitals] ${name}`, { value: roundedValue, rating });
  }

  try {
    // Record on the current scope so it rides along with any active tx.
    Sentry.setMeasurement(name.toLowerCase(), roundedValue, name === "CLS" ? "" : "millisecond");
    Sentry.setTag(`web_vitals.${name.toLowerCase()}.rating`, rating);
    // Also fire a breadcrumb so it shows in the replay timeline for error-affected sessions.
    Sentry.addBreadcrumb({
      category: "web-vitals",
      level: rating === "poor" ? "warning" : "info",
      message: name,
      data: { value: roundedValue, rating, id },
    });
  } catch {
    /* Sentry might not be initialized — fine, reportMetric is best-effort. */
  }

  try {
    const route = typeof window !== "undefined" ? window.location.pathname : "";
    trackEvent("performance.web_vital", {
      vital: name as "CLS" | "INP" | "LCP" | "FCP" | "TTFB",
      value: roundedValue,
      route,
    });
  } catch {
    /* posthog optional */
  }
}

/** Call once after the app mounts. Imports web-vitals lazily to keep the init path cheap. */
export async function initWebVitals(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const mod = await import("web-vitals");
    mod.onCLS(reportMetric);
    mod.onINP(reportMetric);
    mod.onLCP(reportMetric);
    mod.onFCP(reportMetric);
    mod.onTTFB(reportMetric);
  } catch (err) {
    // Non-fatal — Sentry is still useful without vitals.
    console.warn("[web-vitals] failed to initialise", err);
  }
}
