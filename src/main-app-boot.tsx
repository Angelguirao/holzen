// Full app bootstrap — split from main.tsx so coming-soon builds skip Sentry/PostHog/App.
import { createRoot } from "react-dom/client";
import { holzenLog } from "./lib/holzen-console";
import { initSentry, captureException } from "./lib/sentry";
import { initWebVitals } from "./lib/web-vitals";
import { initCid } from "./lib/cid";
import { initPostHog } from "./lib/posthog";
import { SENTRY_DSN } from "./config/public-env";

function assertSentryConfigured() {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocalHost =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local") ||
    host.endsWith(".localhost");
  const isProdMode = import.meta.env.PROD || import.meta.env.MODE === "production";
  const isPublished = !isLocalHost && isProdMode;

  if (isPublished && !SENTRY_DSN) {
    const msg =
      "[startup] SENTRY_DSN missing in a published environment. " +
      "Frontend error reporting is disabled — refusing to boot. " +
      "Set VITE_SENTRY_DSN (or restore the fallback in src/config/public-env.ts) and rebuild.";
    console.error(msg);
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui;background:hsl(40 20% 97%);color:hsl(220 8% 15%);">
          <div style="max-width:520px;text-align:left;">
            <h2 style="margin:0 0 8px;">Configuration error</h2>
            <p style="margin:0 0 12px;">Error reporting (Sentry) is not configured for this build. The app refused to boot so the issue can't go unnoticed.</p>
            <pre style="background:hsl(0 0% 100%);padding:12px;border-radius:8px;overflow:auto;font-size:12px;">VITE_SENTRY_DSN is empty.
Fix: set VITE_SENTRY_DSN in the build env, or restore FALLBACK_SENTRY_DSN
in src/config/public-env.ts, then redeploy.</pre>
          </div>
        </div>
      `;
    }
    throw new Error(msg);
  }
}

function showCrashScreen(label: string, err: unknown) {
  console.error(`[${label}]`, err);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui;background:hsl(40 20% 97%);color:hsl(220 8% 15%);">
        <div style="max-width:500px;text-align:left;">
          <h2 style="margin:0 0 8px;">${label}</h2>
          <pre style="background:hsl(0 0% 100%);padding:12px;border-radius:8px;overflow:auto;font-size:12px;max-height:300px;">${String((err as Error)?.stack || err)}</pre>
          <button type="button" onclick="localStorage.clear();sessionStorage.clear();location.reload()" style="margin-top:12px;padding:8px 16px;background:hsl(220 8% 15%);color:hsl(40 20% 97%);border:0;border-radius:8px;cursor:pointer;">Clear storage & reload</button>
        </div>
      </div>
    `;
  }
}

assertSentryConfigured();
initSentry();
initCid();
initPostHog();

window.addEventListener("error", (e) => {
  captureException(e.error ?? e.message, { source: "window.error" });
  const root = document.getElementById("root");
  if (root && root.children.length === 0) {
    showCrashScreen("Boot error", e.error || e.message);
  }
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("[boot-crash-promise]", e.reason);
  captureException(e.reason, { source: "unhandledrejection" });
});

// Static imports: Lovable preview (and some hosts) resolve dynamic `import("./App.tsx")` to a raw
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
  void initWebVitals();
} catch (err) {
  showCrashScreen("Boot error — failed to load app", err);
}
