// Global error handler — catches module-evaluation crashes that prevent React from mounting
window.addEventListener('error', (e) => {
  console.error('[boot-crash]', e.error || e.message);
  const root = document.getElementById('root');
  if (root && root.children.length === 0) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui;background:#f5f2ec;color:#1f2937;">
        <div style="max-width:500px;text-align:left;">
          <h2 style="margin:0 0 8px;">Boot error</h2>
          <pre style="background:#fff;padding:12px;border-radius:8px;overflow:auto;font-size:12px;max-height:300px;">${String(e.error?.stack || e.error || e.message)}</pre>
          <button onclick="localStorage.clear();sessionStorage.clear();location.reload()" style="margin-top:12px;padding:8px 16px;background:#111;color:#fff;border:0;border-radius:8px;cursor:pointer;">Clear storage & reload</button>
        </div>
      </div>
    `;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[boot-crash-promise]', e.reason);
});

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { listenForSwUpdate } from "./lib/sw-update";

try {
  createRoot(document.getElementById("root")!).render(<App />);
} catch (err) {
  console.error('[render-crash]', err);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui;background:#f5f2ec;color:#1f2937;">
        <div style="max-width:500px;text-align:left;">
          <h2 style="margin:0 0 8px;">Render error</h2>
          <pre style="background:#fff;padding:12px;border-radius:8px;overflow:auto;font-size:12px;max-height:300px;">${String((err as Error)?.stack || err)}</pre>
          <button onclick="localStorage.clear();sessionStorage.clear();location.reload()" style="margin-top:12px;padding:8px 16px;background:#111;color:#fff;border:0;border-radius:8px;cursor:pointer;">Clear storage & reload</button>
        </div>
      </div>
    `;
  }
}

// Show "Update available" banner when a new service worker is ready
listenForSwUpdate();
