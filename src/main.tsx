// Global error handler — catches module-evaluation crashes that prevent React from mounting
import { createRoot } from "react-dom/client";
import "./index.css";
import { holzenLog } from "./lib/holzen-console";
import { initSentry, captureException } from "./lib/sentry";
import { initWebVitals } from "./lib/web-vitals";
import { initCid } from "./lib/cid";
import { initPostHog } from "./lib/posthog";

// Sentry must init before any other code can throw. It no-ops when SENTRY_DSN is empty
// (see src/config/public-env.ts).
initSentry();
// cid is generated on first access, but call initCid() eagerly so the Sentry tag is set
// before any capture happens during early render.
initCid();
// PostHog init — no-op when POSTHOG_KEY is empty. Autocapture/pageview/replay all off.
initPostHog();

function showCrashScreen(label: string, err: unknown) {
  console.error(`[${label}]`, err);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui;background:hsl(40 20% 97%);color:hsl(220 8% 15%);">
        <div style="max-width:500px;text-align:left;">
          <h2 style="margin:0 0 8px;">${label}</h2>
          <pre style="background:hsl(0 0% 100%);padding:12px;border-radius:8px;overflow:auto;font-size:12px;max-height:300px;">${String((err as Error)?.stack || err)}</pre>
          <button onclick="localStorage.clear();sessionStorage.clear();location.reload()" style="margin-top:12px;padding:8px 16px;background:hsl(220 8% 15%);color:hsl(40 20% 97%);border:0;border-radius:8px;cursor:pointer;">Clear storage & reload</button>
        </div>
      </div>
    `;
  }
}

window.addEventListener('error', (e) => {
  captureException(e.error ?? e.message, { source: "window.error" });
  const root = document.getElementById("root");
  if (root && root.children.length === 0) {
    showCrashScreen("Boot error", e.error || e.message);
  }
});

window.addEventListener('unhandledrejection', (e) => {
  // Previous version only logged — we now forward to Sentry so promise chain regressions
  // (e.g. stale Supabase queries, PWA update races) surface in the same workflow as sync errors.
  console.error('[boot-crash-promise]', e.reason);
  captureException(e.reason, { source: "unhandledrejection" });
});

// Static imports: Lovable preview (and some hosts) resolve `import("./App.tsx")` to a raw
// `/src/App.tsx` URL that is not served as JS — boot fails with "Failed to fetch dynamically imported module".
import "./i18n";
import App from "./App.tsx";
import { listenForSwUpdate } from "./lib/sw-update";

try {
  holzenLog.boot("start");
  holzenLog.boot("createRoot + render <App />");
  createRoot(document.getElementById("root")!).render(<App />);
  listenForSwUpdate();
  holzenLog.boot("listenForSwUpdate registered");
  // Fire after first paint so the import doesn't delay render. Errors are swallowed inside.
  void initWebVitals();
} catch (err) {
  showCrashScreen("Boot error — failed to load app", err);
}
