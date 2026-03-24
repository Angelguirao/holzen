// Global error handler — catches module-evaluation crashes that prevent React from mounting
import { createRoot } from "react-dom/client";
import "./index.css";

function showCrashScreen(label: string, err: unknown) {
  console.error(`[${label}]`, err);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui;background:#f5f2ec;color:#1f2937;">
        <div style="max-width:500px;text-align:left;">
          <h2 style="margin:0 0 8px;">${label}</h2>
          <pre style="background:#fff;padding:12px;border-radius:8px;overflow:auto;font-size:12px;max-height:300px;">${String((err as Error)?.stack || err)}</pre>
          <button onclick="localStorage.clear();sessionStorage.clear();location.reload()" style="margin-top:12px;padding:8px 16px;background:#111;color:#fff;border:0;border-radius:8px;cursor:pointer;">Clear storage & reload</button>
        </div>
      </div>
    `;
  }
}

window.addEventListener('error', (e) => {
  const root = document.getElementById("root");
  if (root && root.children.length === 0) {
    showCrashScreen("Boot error", e.error || e.message);
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[boot-crash-promise]', e.reason);
});

async function boot() {
  try {
    const [{ default: App }, { listenForSwUpdate }] = await Promise.all([
      import("./App.tsx"),
      import("./lib/sw-update"),
    ]);
    await import("./i18n");
    createRoot(document.getElementById("root")!).render(<App />);
    listenForSwUpdate();
  } catch (err) {
    showCrashScreen("Boot error — failed to load app", err);
  }
}

boot();
